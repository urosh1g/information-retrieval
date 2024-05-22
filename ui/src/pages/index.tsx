import { Autocomplete, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import FileUpload from "@/components/FileUpload/FileUpload";
import api from "@/api";
import { Doc, ElasticResponse } from "@/models/search-response";
import FileList from "@/components/FileList/FileList";

const fields: string[] = [
  "contents", "size", "name", "timestamp"
];

const PAGE_SIZE: number = 5;

export default function Home() {
  const [searchValue, setSearchValue] = useState("");
  const [field, setField] = useState("");
  const [results, setResults] = useState<Doc[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const handleSearch = async () => {
    const params = new URLSearchParams();
    field && params.append("property", field);
    searchValue && params.append("value", searchValue);
    params.append("from", ((pageNumber - 1) * PAGE_SIZE + 1).toString());
    api.get<ElasticResponse>(`/search?${params.toString()}`)
      .then(response => {
        setResults(response.data.docs);
        setTotalPages(Math.round(response.data.total / PAGE_SIZE + 0.5));
      })
      .catch((err: Error) => {
        toast(`Failed fetching docs: ${err.message}`, { type: "error" });
      });
  }

  useEffect(() => {
    if (!searchValue) return;
    handleSearch();
  }, [pageNumber]);

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
      {totalPages && <Typography variant="h4" p="16px">Total: {totalPages * 5}</Typography>}
      <FileList files={results} />
      <Stack direction="row">
        {totalPages &&
          <Box>
            Page {pageNumber} of {totalPages}
          </Box>
        }
        <Button
          disabled={pageNumber == 1}
          onClick={() => {
            setPageNumber(pageNumber - 1);
          }}
        >
          Prev
        </Button>
        <Button
          disabled={pageNumber == totalPages || !totalPages}
          onClick={() => {
            setPageNumber(pageNumber + 1);
          }}
        >
          Next
        </Button>
      </Stack>
    </Box>
  );
}
