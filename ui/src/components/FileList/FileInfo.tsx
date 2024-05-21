import { ElasticResponse } from "@/models/search-response";
import { Stack, Typography } from "@mui/material";

type Props = {
  file: ElasticResponse;
}
export default function FileInfo({ file }: Props) {
  const timestamp = new Date(file._source.timestamp * 1000);
  return (
    <Stack
      sx={{
        gap: "8px",
        border: "1px solid black",
        color: "black",
        padding: "8px",
      }}
    >
      <Typography>Id: {file._id}</Typography>
      <Typography>Name: {file._source.name}</Typography>
      <Typography>Start text: {file._source.contents.slice(0, 20)}</Typography>
      <Typography>Size: {file._source.size}</Typography>
      <Typography>Timestamp: {timestamp.toISOString()}</Typography>
      <Typography>Score: {file._score}</Typography>
    </Stack>
  );
}
