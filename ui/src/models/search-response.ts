export type Doc = {
  _id: string;
  _index: string;
  _score: number;
  _source: {
    contents: string;
    name: string;
    size: number;
    timestamp: number;
  }
}

export type ElasticResponse = {
  docs: Doc[];
  total: number;
};
