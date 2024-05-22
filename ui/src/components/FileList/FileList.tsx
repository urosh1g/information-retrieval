import { Doc, ElasticResponse } from "@/models/search-response"
import { Stack } from "@mui/material";
import FileInfo from "./FileInfo";

type Props = {
  files: Doc[];
}

export default function FileList({ files }: Props) {
  if (files.length === 0) return null;
  return (
    <Stack>
      {files.map(file => <FileInfo key={file._id} file={file} />)}
    </Stack>
  );
}
