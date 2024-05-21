import { Button } from "@mui/material";
import { ChangeEvent } from "react";
import { toast } from "react-toastify";
import api from "@/api";

export default function FileUpload() {

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/index", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      if ("error" in response) {
        toast("Could not index file!", { type: "error" });
      }
      toast("File indexed!", { type: "success" });
    }
  }

  return (
    <Button
      component="label"
      variant="contained"
      sx={{
        m: "16px",
      }}
    >
      Indeksiraj
      <input
        type="file"
        hidden
        onChange={handleFileUpload}
      />
    </Button>
  );
}
