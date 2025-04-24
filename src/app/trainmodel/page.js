"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ModelTrainingIcon from "@mui/icons-material/ModelTraining";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Container,
  Card,
  CardContent,
  Alert,
  Chip,
} from "@mui/material";

export default function TrainModelPage() {
  const router = useRouter();
  const [modelName, setModelName] = useState("");
  const [epochVal, setEpochVal] = useState("");
  const [kfoldVal, setKfoldVal] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [mainMenuAnchor, setMainMenuAnchor] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/user", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch user data");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchUser();
  }, []);

  const logout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
    setUserMenuAnchor(null);
  };

  const getCookie = (name) => {
    if (typeof window === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const handleTrain = async () => {
    if (!modelName.trim()) return setError("Model name is required.");
    if (!file) return setError("CSV file is required.");

    const epoch = Number(epochVal);
    const kfold = Number(kfoldVal);
    if (!Number.isInteger(epoch) || epoch < 1)
      return setError("Epoch must be integer >= 1");
    if (!Number.isInteger(kfold) || kfold < 1)
      return setError("K-Fold must be integer >= 1");

    setError("");
    setLoading(true);
    try {
      const token = getCookie("token");
      const formData = new FormData();
      formData.append("csv", file);
      formData.append("epoch", epochVal);
      formData.append("kfold", kfoldVal);

      const response = await fetch("/api/train", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      router.push(
        `/result?output=${encodeURIComponent(JSON.stringify(data))}&modelName=${encodeURIComponent(modelName)}`,
      );
    } catch (err) {
      setError(err.message || "Training failed.");
    } finally {
      setLoading(false);
    }
  };

  const fileChange = (e) => {
    if (e.target.files?.length > 0) setFile(e.target.files[0]);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
      <AppBar
        position="fixed"
        elevation={3}
        sx={{ backgroundColor: "#861F41" }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={(e) => setMainMenuAnchor(e.currentTarget)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            Crash Rate Prediction Dashboard
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            sx={{
              borderRadius: 2,
              backgroundColor: "white",
              color: "black",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": { backgroundColor: "#e0e0e0" },
            }}
          >
            {user?.username || "User"}
          </Button>

          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={() => setUserMenuAnchor(null)}
            sx={{ mt: 1 }}
          >
            <MenuItem onClick={logout}>Logout</MenuItem>
          </Menu>

          <Menu
            anchorEl={mainMenuAnchor}
            open={Boolean(mainMenuAnchor)}
            onClose={() => setMainMenuAnchor(null)}
            sx={{ mt: 1 }}
          >
            <MenuItem onClick={() => router.push("/")}>Home</MenuItem>
            <MenuItem onClick={() => router.push("/newmodel")}>
              Add New Model
            </MenuItem>
            <MenuItem onClick={() => router.push("/managemodel")}>
              Manage and View Models
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ pt: 12, pb: 6 }}>
        <Card elevation={3} sx={{ borderRadius: 2, mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
              <IconButton onClick={() => router.push("/")} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: "#861F41" }}
              >
                <ModelTrainingIcon sx={{ mr: 1 }} /> Train New Model
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Model Name"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Epoch"
              value={epochVal}
              onChange={(e) => setEpochVal(e.target.value)}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="K-Fold"
              value={kfoldVal}
              onChange={(e) => setKfoldVal(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                Upload CSV
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 4,
                  border: "2px dashed #C95B0C",
                  borderRadius: 2,
                  backgroundColor: "#f5f5f5",
                  minHeight: "250px",
                }}
              >
                <CloudUploadIcon
                  sx={{ fontSize: 48, color: "#861F41", mb: 2 }}
                />

                {file ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Chip
                      label={file.name}
                      onDelete={() => setFile(null)}
                      sx={{ backgroundColor: "#861F41", color: "white" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      File size: {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                    <Button
                      variant="outlined"
                      component="label"
                      sx={{
                        mt: 2,
                        borderRadius: 2,
                        color: "#861F41",
                        borderColor: "#861F41",
                      }}
                    >
                      Change File
                      <input
                        type="file"
                        hidden
                        onChange={fileChange}
                        accept=".csv"
                      />
                    </Button>
                  </Box>
                ) : (
                  <>
                    <Typography>Drag and drop your CSV file here</Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      or
                    </Typography>
                    <Button
                      variant="contained"
                      component="label"
                      sx={{
                        borderRadius: 2,
                        backgroundColor: "#861F41",
                        "&:hover": { backgroundColor: "#6d1b36" },
                      }}
                    >
                      Browse Files
                      <input
                        type="file"
                        hidden
                        onChange={fileChange}
                        accept=".csv"
                      />
                    </Button>
                  </>
                )}
              </Box>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Button
                variant="contained"
                onClick={handleTrain}
                disabled={loading}
                startIcon={<ModelTrainingIcon />}
                sx={{
                  backgroundColor: "#861F41",
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#6d1b36" },
                }}
              >
                {loading ? "Training..." : "Train Model"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
