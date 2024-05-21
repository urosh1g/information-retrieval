import { Autocomplete, Box, Button, Stack, TextField } from "@mui/material";
import { useState } from "react";
import { toast } from "react-toastify";
import FileUpload from "@/components/FileUpload/FileUpload";
import api from "@/api";
import { ElasticResponse } from "@/models/search-response";
import FileList from "@/components/FileList/FileList";

const fields: string[] = [
  "contents", "size", "name", "timestamp"
];

export default function Home() {
  const [searchValue, setSearchValue] = useState("");
  const [field, setField] = useState("");
  const [results, setResults] = useState<ElasticResponse[]>([]);

  const handleSearch = async () => {
    const params = new URLSearchParams();
    field && params.append("property", field);
    searchValue && params.append("value", searchValue);
    api.get<ElasticResponse[]>(`/search?${params.toString()}`)
      .then(response => {
        setResults(response.data);
      })
      .catch((err: Error) => {
        toast(`Failed fetching docs: ${err.message}`, { type: "error" });
      });
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        flexDirection: "column",
      }}
    >
      <Stack sx={{
        gap: "8px",
      }}>
        <FileUpload />
        <Autocomplete
          value={field}
          onChange={(_, value) => setField(value!)}
          renderInput={(params) =>
            <TextField
              {...params}
              label="Polje"
            />
          }
          options={fields}
        ></Autocomplete>
        <TextField
          label="Upit"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        >
        </TextField>
        <Button
          variant="contained"
          onClick={handleSearch}
        >
          Trazi</Button>
      </Stack>
      <FileList files={results} />
    </Box>
  );
}
