"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Box, Typography, Button, Container, Alert } from "@mui/material";
import toast from "react-hot-toast";

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modelOutput, setModelOutput] = useState(null);
  const [modelName, setModelName] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const output = JSON.parse(searchParams.get("output") || "{}");
      const name = searchParams.get("modelName") || "";
      setModelOutput(output);
      setModelName(name);
    } catch (err) {
      setError("Invalid model output data.");
    }

    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/user");
        if (!res.ok) throw new Error("Failed to fetch user data");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchUser();
  }, [searchParams]);

  const handleAccept = async () => {
    const toastId = toast.loading("Saving model...");
    try {
      const response = await fetch("http://127.0.0.1:8000/download_model");
      const blob = await response.blob();
      const modelFile = new File([blob], `${modelName}.keras`, {
        type: "application/octet-stream",
      });

      const formData = new FormData();
      formData.append("name", modelName);
      formData.append(
        "inputFields",
        JSON.stringify([
          "CountStation",
          "Weaving",
          "Lanes",
          "Curvature(degrees/100feet)",
          "CalLength(meters)",
          "CAR_SPEED_",
          "ADT",
        ]),
      );
      formData.append("userId", user?.userId);
      formData.append("modelFile", modelFile);

      const uploadRes = await fetch("/api/models", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Model upload failed.");
      toast.success("Model saved successfully!", { id: toastId });
      router.push("/trainmodel");
    } catch (err) {
      toast.error(err.message || "Model save failed.", { id: toastId });
      setError(err.message);
    }
  };

  const handleReject = () => {
    toast("Model rejected. Try training again.");
    router.push("/trainmodel");
  };

  if (error) return <Alert severity="error">{error}</Alert>;

  if (!modelOutput) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="sm" sx={{ pt: 10 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 2,
        }}
      >
        <Typography
          variant="h3"
          sx={{ textDecoration: "underline" }}
          gutterBottom
        >
          Training Results
        </Typography>

        <Typography variant="h5">
          <strong>Average Train MSE:</strong>{" "}
          {modelOutput.result?.["Average Train MSE"]}
        </Typography>
        <Typography variant="h5">
          <strong>Average Train MAE:</strong>{" "}
          {modelOutput.result?.["Average Train MAE"]}
        </Typography>
        <Typography variant="h5">
          <strong>Average Train R²:</strong>{" "}
          {modelOutput.result?.["Average Train R²"]}
        </Typography>

        <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            color="success"
            size="large"
            onClick={handleAccept}
          >
            Accept
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="large"
            onClick={handleReject}
          >
            Reject
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
