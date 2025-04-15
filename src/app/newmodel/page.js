"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ModelTrainingIcon from "@mui/icons-material/ModelTraining";
import SaveIcon from "@mui/icons-material/Save";

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
  Grid,
  Paper,
  Divider,
  Chip,
} from "@mui/material";

export default function NewModelPage() {
  const [modelName, setModelName] = useState("");
  const [inputs, setInputs] = useState([""]);
  const [modelFile, setModelFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [mainMenuAnchor, setMainMenuAnchor] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/auth/user", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch user data.");
        }

        const data = await res.json();
        setUser({
          userId: data.userId,
          username: data.username,
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const inputChange = (index, value) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const addInput = () => {
    setInputs([...inputs, ""]);
  };

  const removeInput = (index) => {
    if (inputs.length === 1) return; // Prevent removing the last input field
    const newInputs = inputs.filter((_, i) => i !== index);
    setInputs(newInputs);
  };

  const fileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setModelFile(e.target.files[0]);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!modelName.trim()) {
      setError("Model name is required.");
      return;
    }

    if (inputs.some((input) => !input.trim())) {
      setError("All input fields must be filled.");
      return;
    }

    if (!modelFile) {
      setError("Model file is required.");
      return;
    }

    const extension = modelFile.name.split(".").pop().toLowerCase();
    if (extension !== "keras" && extension !== "h5") {
      setError("Invalid model file. Only .keras and .h5 files are accepted.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const userRes = await fetch("/api/auth/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!userRes.ok) {
        throw new Error("User not authenticated. Please log in.");
      }
      const userData = await userRes.json();
      const userId = userData.userId;

      const formData = new FormData();
      formData.append("name", modelName);
      formData.append("inputFields", JSON.stringify(inputs));
      formData.append("userId", userId);
      formData.append("modelFile", modelFile);
      const response = await fetch("/api/models", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload model.");
      }

      const responseData = await response.json();
      console.log("Model uploaded successfully:", responseData);

      router.push("/managemodel");
    } catch (err) {
      console.error("Error uploading model:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const userMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const userMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const mainMenuOpen = (event) => {
    setMainMenuAnchor(event.currentTarget);
  };

  const mainMenuClose = () => {
    setMainMenuAnchor(null);
  };

  const logout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
    userMenuClose();
  };

  const goHome = () => {
    router.push("/");
    mainMenuClose();
  };

  //   const goModels = () => {
  //     router.push("/managemodel");
  //     mainMenuClose();
  //   };

  const navigateToModelsList = () => {
    router.push("/managemodel");
    mainMenuClose();
  };

  const navigateToTrainModel = () => {
    router.push("/trainmodel");
    mainMenuClose();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fa",
      }}
    >
      {/*app bar that matches the home page*/}
      <AppBar
        position="fixed"
        elevation={3}
        sx={{ backgroundColor: "#861F41" }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={mainMenuOpen}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: "bold" }}
          >
            Crash Rate Prediction Dashboard
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={userMenuOpen}
            sx={{
              borderRadius: 2,
              backgroundColor: "white",
              color: "black",
              "&:hover": {
                backgroundColor: "#e0e0e0",
              },
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            {user ? user.username : "User"}
          </Button>

          {/*user menu*/}
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={userMenuClose}
            sx={{ mt: 1 }}
          >
            <MenuItem onClick={logout}>Logout</MenuItem>
          </Menu>

          {/*main menu*/}
          <Menu
            anchorEl={mainMenuAnchor}
            open={Boolean(mainMenuAnchor)}
            onClose={mainMenuClose}
            sx={{ mt: 1 }}
          >
            <MenuItem onClick={goHome}>Home</MenuItem>
            {/* <MenuItem onClick={goModels}>Manage Models</MenuItem> */}
            <MenuItem onClick={navigateToModelsList}>
              Manage and View Models
            </MenuItem>
            <MenuItem onClick={navigateToTrainModel}>Train Model</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ pt: 10, pb: 6 }}>
        <Card
          elevation={3}
          sx={{
            borderRadius: 2,
            overflow: "visible",
            position: "relative",
            "&::before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "8px",
              backgroundColor: "#861F41", //accent card color
              borderTopLeftRadius: "8px",
              borderTopRightRadius: "8px",
            },
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
              <IconButton
                onClick={() => router.push("/managemodel")}
                sx={{ mr: 2 }}
                aria-label="go back"
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  color: "#861F41", //add new model text color
                }}
              >
                <ModelTrainingIcon sx={{ mr: 1 }} /> Add New Model
              </Typography>
            </Box>

            <Box component="form" onSubmit={submit}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              <Grid container spacing={3}>
                {/*field for the model name*/}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 1, fontWeight: 500 }}
                  >
                    Model Name
                  </Typography>
                  <TextField
                    variant="outlined"
                    fullWidth
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="Name of model"
                    required
                    InputProps={{
                      sx: { borderRadius: 1 },
                    }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                  Input Fields (Ordered)
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Define the input parameters your model expects in order
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                  }}
                >
                  {inputs.map((input, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Chip
                        label={`#${index + 1}`}
                        size="small"
                        sx={{ mr: 2, backgroundColor: "#e0e0e0" }}
                      />
                      <TextField
                        variant="outlined"
                        fullWidth
                        value={input}
                        onChange={(e) => inputChange(index, e.target.value)}
                        placeholder={`Input parameter name`}
                        required
                        size="small"
                        InputProps={{
                          sx: { borderRadius: 1 },
                        }}
                      />
                      <IconButton
                        aria-label="remove input"
                        onClick={() => removeInput(index)}
                        disabled={inputs.length === 1}
                        sx={{ ml: 1 }}
                        color="error"
                        size="small"
                      >
                        <RemoveIcon />
                      </IconButton>
                    </Box>
                  ))}

                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 3 }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addInput}
                      size="small"
                      color="#861F41"
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                      }}
                    >
                      Add Input Field
                    </Button>
                  </Box>
                </Paper>
              </Box>

              <Divider sx={{ my: 4 }} />

              {/*uploading model file*/}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Upload Model File
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Only .keras and .h5 files are accepted
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: 3,
                    border: "2px dashed #C95B0C",
                    borderRadius: 2,
                    backgroundColor: "#f5f5f5",
                    textAlign: "center",
                  }}
                >
                  <CloudUploadIcon
                    sx={{ fontSize: 48, color: "#861F41", mb: 2 }}
                  />

                  {modelFile ? (
                    <Box sx={{ width: "100%" }}>
                      <Chip
                        label={modelFile.name}
                        color="#861F41"
                        onDelete={() => setModelFile(null)}
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="body2" color="black">
                        File selected (
                        {(modelFile.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        Drag and drop your model file here
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        or
                      </Typography>
                    </>
                  )}

                  <Button
                    variant="contained"
                    component="label"
                    sx={{
                      borderRadius: 2,
                      backgroundColor: modelFile ? "#861F41" : "#861F41", // browse files color
                      "&:hover": {
                        backgroundColor: modelFile ? "#861F41" : "#861F41",
                      },
                      textTransform: "none",
                    }}
                  >
                    {modelFile ? "Change File" : "Browse Files"}
                    <input
                      type="file"
                      hidden
                      onChange={fileChange}
                      accept=".keras,.h5"
                    />
                  </Button>
                </Box>
              </Box>

              {/* Submit Button */}
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  startIcon={<SaveIcon />}
                  sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: 2,
                    backgroundColor: "#861F41", //save model color
                    "&:hover": {
                      backgroundColor: "#861F41",
                    },
                    textTransform: "none",
                    fontWeight: 500,
                  }}
                >
                  {loading ? "Uploading..." : "Save Model"}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
