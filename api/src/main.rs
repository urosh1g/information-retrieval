use actix_cors::Cors;
use actix_multipart::Multipart;
use actix_web::{
    get,
    http::StatusCode,
    middleware::Logger,
    post,
    web::{self, Buf},
    App, HttpResponse, HttpServer, Responder,
};
use elasticsearch::{
    self,
    http::{response::Response, transport::Transport},
    indices::{IndicesCreateParts, IndicesGetParts},
    Elasticsearch, SearchParts,
};
use env_logger;
use futures::{StreamExt, TryStreamExt};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

const IDX_NAME: &str = "testindex";

#[derive(Deserialize, Serialize)]
struct SearchQuery {
    property: String,
    value: String,
    from: Option<i64>,
}

#[get("/health-check")]
pub async fn health_check(_data: web::Data<AppData>) -> impl Responder {
    HttpResponse::Ok()
}

#[post("/index")]
pub async fn index(mut payload: Multipart, app_data: web::Data<AppData>) -> HttpResponse {
    let elastic = app_data.elasticsearch_client.clone();
    while let Ok(Some(mut field)) = payload.try_next().await {
        let content_disposition = field.content_disposition();
        let name = content_disposition.get_filename().unwrap().to_string();
        let mut contents = String::new();
        let mut size = 0;
        let timestamp = chrono::Utc::now().timestamp();

        while let Some(chunk) = field.next().await {
            let data = chunk.unwrap();
            size += data.len();
            let data = String::from_utf8(data.chunk().to_vec()).unwrap();
            contents.push_str(&data);
        }
        elastic
            .index(elasticsearch::IndexParts::Index(IDX_NAME))
            .body(json!({
                "contents": contents,
                "name": name,
                "size": size,
                "timestamp": timestamp
            }))
            .send()
            .await
            .err();
    }
    HttpResponse::Ok().into()
}

#[get("/search")]
pub async fn search(app_data: web::Data<AppData>, query: web::Query<SearchQuery>) -> HttpResponse {
    let client = app_data.elasticsearch_client.clone();
    let query = query.into_inner();
    let total = client
        .count(elasticsearch::CountParts::Index(&[IDX_NAME]))
        .q(&format!("{}:{}", query.property, query.value))
        .send()
        .await
        .unwrap()
        .json::<Value>()
        .await
        .unwrap();
    let total = total["count"].clone();
    let results = client
        .search(SearchParts::Index(&[IDX_NAME]))
        .from(query.from.unwrap_or(1) - 1)
        .size(5)
        .body(json!({
            "query": {
                "match": {
                    query.property: query.value,
                }
            }
        }))
        .send()
        .await;
    match results {
        Ok(result) => {
            let mut docs = Vec::new();
            let body = result.json::<Value>().await.unwrap();
            for hit in body["hits"]["hits"].as_array().unwrap() {
                docs.push(hit);
            }
            HttpResponse::Ok()
                .json(json!({
                    "docs": docs,
                    "total": total,
                }))
                .into()
        }
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
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
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    let client = get_client()?;
    let index_definition = get_index_definition();
    let response = create_index(&client, IDX_NAME, &index_definition).await;
    assert!(response.status_code() == StatusCode::OK);
    HttpServer::new(move || {
        let cors = Cors::permissive();
        App::new()
            .wrap(Logger::default())
            .wrap(cors)
            .app_data(web::Data::new(AppData {
                elasticsearch_client: client.clone(),
            }))
            .service(health_check)
            .service(index)
            .service(search)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
    .unwrap();
    Ok(())
}
