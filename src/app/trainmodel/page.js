"use client";

//colors:
//maroon: 861F41
//orange: C95B0C

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ModelTrainingIcon from "@mui/icons-material/ModelTraining";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import toast from "react-hot-toast";

import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  AppBar,
  Toolbar,
  Menu,
  Container,
  Card,
  CardContent,
  Alert,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Chip,
} from "@mui/material";

export default function TrainModelPage() {
  const [modelName, setModelName] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [dataFile, setDataFile] = useState(null);
  const [models, setModels] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
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
          role: data.role
        });
        
        // Redirect if not admin
        if (data.role !== "admin") {
          toast.error("You don't have permission to train models.");
          router.push("/");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  useEffect(() => {
    const fetchModels = async () => {
      if (!user) return;
      
      try {
        setLoadingModels(true);
        const response = await fetch("/api/models", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch models.");
        }
        
        const data = await response.json();
        setModels(data);
      } catch (err) {
        console.error("Error fetching models:", err);
        setError(err.message || "Failed to fetch models.");
      } finally {
        setLoadingModels(false);
      }
    };
    
    if (user) {
      fetchModels();
    }
  }, [user]);

  const isAdmin = user && user.role === "admin";

  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
  };

  const handleNameChange = (event) => {
    setModelName(event.target.value);
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setDataFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check admin again for security
    if (!isAdmin) {
      toast.error("You don't have permission to train models.");
      return;
    }
    
    if (!selectedModel) {
      setError("Please select a model.");
      return;
    }
    
    if (!modelName.trim()) {
      setError("Model name is required.");
      return;
    }
    
    if (!dataFile) {
      setError("Training data file is required.");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("baseModelId", selectedModel);
      formData.append("newModelName", modelName);
      formData.append("trainingData", dataFile);
      formData.append("userId", user.userId);
      
      const response = await fetch("http://127.0.0.1:8000/train", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Training failed.");
      }
      
      const result = await response.json();
      
      // Redirect to results page with output data
      router.push(`/resultpage?output=${encodeURIComponent(JSON.stringify(result))}&modelName=${encodeURIComponent(modelName)}`);
    } catch (err) {
      console.error("Error during training:", err);
      setError(err.message || "Failed to train model.");
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

  const goAddModel = () => {
    if (!isAdmin) {
      toast.error("You don't have permission to add models.");
      return;
    }
    router.push("/newmodel");
    mainMenuClose();
  };

  const goModelsList = () => {
    router.push("/managemodel");
    mainMenuClose();
  };

  if (userLoading) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fa", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Only allow admin access
  if (!isAdmin) {
    return null; // Router will redirect in useEffect
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fa",
      }}
    >
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

          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={userMenuClose}
            sx={{ mt: 1 }}
          >
            {isAdmin && (
              <MenuItem
                onClick={() => {
                  router.push("/admin");
                  userMenuClose();
                }}
                sx={{
                  color: "#861F41",
                  fontWeight: 500,
                }}
              >
                <AdminPanelSettingsIcon sx={{ mr: 1, fontSize: 20 }} />
                Admin Control Panel
              </MenuItem>
            )}
            <MenuItem onClick={logout}>Logout</MenuItem>
          </Menu>

          <Menu
            anchorEl={mainMenuAnchor}
            open={Boolean(mainMenuAnchor)}
            onClose={mainMenuClose}
            sx={{ mt: 1 }}
          >
            <MenuItem onClick={goHome}>Home</MenuItem>
            {isAdmin ? (
              <>
                <MenuItem onClick={goAddModel}>Add New Model</MenuItem>
                <MenuItem onClick={goModelsList}>Manage Models</MenuItem>
              </>
            ) : (
              <MenuItem onClick={goModelsList}>View Models</MenuItem>
            )}
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
              backgroundColor: "#861F41",
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
                  color: "#861F41",
                }}
              >
                <ModelTrainingIcon sx={{ mr: 1 }} /> Train Model
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2, fontWeight: 500 }}
                >
                  Select Base Model
                </Typography>
                
                {loadingModels ? (
                  <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : models.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    No models available. Please add a model first.
                  </Alert>
                ) : (
                  <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
                    <InputLabel id="model-select-label">Base Model</InputLabel>
                    <Select
                      labelId="model-select-label"
                      id="model-select"
                      value={selectedModel}
                      onChange={handleModelChange}
                      label="Base Model"
                      required
                      sx={{ borderRadius: 1 }}
                    >
                      {models.map((model) => (
                        <MenuItem key={model._id} value={model._id}>
                          {model.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 1, fontWeight: 500 }}
                  >
                    New Model Name
                  </Typography>
                  <TextField
                    variant="outlined"
                    fullWidth
                    value={modelName}
                    onChange={handleNameChange}
                    placeholder="Enter name for trained model"
                    required
                    InputProps={{
                      sx: { borderRadius: 1 },
                    }}
                    sx={{ mb: 3 }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Upload Training Data
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Upload CSV file with training data
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

                  {dataFile ? (
                    <Box sx={{ width: "100%" }}>
                      <Chip
                        label={dataFile.name}
                        color="primary"
                        onDelete={() => setDataFile(null)}
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="body2" color="primary">
                        File selected (
                        {(dataFile.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        Drag and drop your CSV file here
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
                      backgroundColor: "#861F41",
                      "&:hover": {
                        backgroundColor: "#861F41",
                      },
                      textTransform: "none",
                    }}
                  >
                    {dataFile ? "Change File" : "Browse Files"}
                    <input
                      type="file"
                      hidden
                      onChange={handleFileChange}
                      accept=".csv"
                    />
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={loading || !selectedModel || !modelName || !dataFile}
                  startIcon={<PlayArrowIcon />}
                  sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: 2,
                    backgroundColor: "#C95B0C",
                    "&:hover": {
                      backgroundColor: "#C95B0C",
                    },
                    textTransform: "none",
                    fontWeight: 500,
                  }}
                >
                  {loading ? "Training..." : "Start Training"}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}