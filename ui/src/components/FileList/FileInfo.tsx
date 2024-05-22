import { Doc } from "@/models/search-response";
import { Link, Stack, Typography } from "@mui/material";
import { useMemo } from "react";

type Props = {
  file: Doc;
}
export default function FileInfo({ file }: Props) {
  const timestamp = new Date(file._source.timestamp * 1000);

  const downloadUrl = useMemo(() => {
    const blob = new Blob([file._source.contents], { type: "text/plain" });
    return URL.createObjectURL(blob);
  }, [file]);

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
      <Typography>Score: {file._score}</Typography>
      <Link
        href={downloadUrl}
        download={file._source.name}
        target="_blank"
        sx={{
          cursor: "pointer",
        }}
      >
        Name: {file._source.name}
      </Link>
      <Typography>Start text: {file._source.contents.slice(0, 20)}</Typography>
      <Typography>Size: {file._source.size}B</Typography>
      <Typography>Indexed at: {timestamp.toISOString()}</Typography>
    </Stack>
  );
}
