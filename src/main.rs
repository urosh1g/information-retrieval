use actix_web::{get, http::StatusCode, web, App, HttpResponse, HttpServer, Responder};
use elasticsearch::{
    self,
    http::{response::Response, transport::Transport},
    indices::{IndicesCreateParts, IndicesGetParts},
    Elasticsearch,
};
use serde_json::{json, Value};

const IDX_NAME: &str = "testindex";

#[get("/health-check")]
pub async fn health_check(_data: web::Data<AppData>) -> impl Responder {
    HttpResponse::Ok()
}

struct AppData {
    elasticsearch_client: Elasticsearch,
}

fn get_index_definition() -> Value {
    json!({
        "mappings": {
            "properties": {
                "contents": {"type": "text"},
                "size": {"type": "integer"},
                "name": {"type": "text"},
                "timestamp": {"type": "date"},
            },
        }
    })
}

fn get_client() -> Result<Elasticsearch, elasticsearch::Error> {
    let transport = Transport::single_node("http://localhost:9200")?;
    Ok(Elasticsearch::new(transport))
}

async fn create_index(client: &Elasticsearch, name: &str, index_def: &Value) -> Response {
    let resp = client
        .indices()
        .get(IndicesGetParts::Index(&[name]))
        .send()
        .await
        .expect("Should be able to make a request");
    if resp.status_code() == StatusCode::NOT_FOUND {
        client
            .indices()
            .create(IndicesCreateParts::Index(name))
            .body(index_def)
            .pretty(true)
            .send()
            .await
            .expect("Should be able to make a request")
    } else {
        resp
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = get_client()?;
    let index_definition = get_index_definition();
    let response = create_index(&client, IDX_NAME, &index_definition).await;
    assert!(response.status_code() == StatusCode::OK);
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(AppData {
                elasticsearch_client: client.clone(),
            }))
            .service(health_check)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
    .unwrap();
    Ok(())
}
