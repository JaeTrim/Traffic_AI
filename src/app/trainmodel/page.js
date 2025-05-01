"use client";

//colors:
//maroon: 861F41
//orange: C95B0C

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ModelTrainingIcon from "@mui/icons-material/ModelTraining";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

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
  Divider,
  Grid,
  CircularProgress,
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
  const [userLoading, setUserLoading] = useState(true);
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
        
        // Set the user data
        setUser(data);
        
        // Check if user is not an admin, redirect to home page
        if (data.role !== "admin") {
          // Display an error message briefly before redirecting
          setError("You don't have permission to access this page.");
          // Redirect after a brief delay to allow the error message to be seen
          setTimeout(() => {
            router.push("/");
          }, 1500);
        }
      } catch (err) {
        setError(err.message || "Authentication failed");
        // Redirect to login on auth error
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } finally {
        setUserLoading(false);
      }
    };
    
    fetchUser();
  }, [router]);
  
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
    if (!epochVal || !Number.isInteger(epoch) || epoch < 1)
      return setError("Epoch must be integer >= 1");
    if (!kfoldVal || !Number.isInteger(kfold) || kfold < 1)
      return setError("K-Fold must be integer >= 1");
    
    setError("");
    setLoading(true);
    
    try {
      const token = getCookie("token");
      const formData = new FormData();
      formData.append("csv", file);
      formData.append("epoch", epochVal);
      formData.append("kfold", kfoldVal);
      formData.append("newModelName", modelName);
      
      const response = await fetch("/api/train", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) {
        // If server sends { error: "Something wrong" } or { message: "..." }
        throw new Error(
          data.error || data.message || "Training failed with server error.",
        );
      }
      
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
  
  const isAdmin = user && user.role === "admin";
  
  // Show loading indicator while checking user authentication
  if (userLoading) {
    return (
      <Box 
        sx={{ 
          minHeight: "100vh", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          backgroundColor: "#f5f7fa" 
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ color: "#861F41" }} />
      </Box>
    );
  }
  
  // Prevent non-admin users from viewing the page content
  if (!isAdmin) {
    return (
      <Box 
        sx={{ 
          minHeight: "100vh", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          backgroundColor: "#f5f7fa",
          flexDirection: "column",
          p: 3 
        }}
      >
        <Alert 
          severity="error" 
          sx={{ mb: 3, maxWidth: 500 }}
        >
          You don't have permission to access this page. Redirecting...
        </Alert>
        <CircularProgress size={40} thickness={4} sx={{ color: "#861F41" }} />
      </Box>
    );
  }
  
  // The rest of your component for admin users only
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
            sx={{ mr: 2 }}
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
          
          {/* User menu */}
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={() => setUserMenuAnchor(null)}
            sx={{ mt: 1 }}
          >
            {isAdmin && (
              <MenuItem
                onClick={() => {
                  router.push("/admin");
                  setUserMenuAnchor(null);
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
          
          {/* Main menu */}
          <Menu
            anchorEl={mainMenuAnchor}
            open={Boolean(mainMenuAnchor)}
            onClose={() => setMainMenuAnchor(null)}
            sx={{ mt: 1 }}
          >
            <MenuItem onClick={() => router.push("/")}>Home</MenuItem>
            {isAdmin ? (
              <>
                <MenuItem onClick={() => router.push("/newmodel")}>
                  Add New Model
                </MenuItem>
                <MenuItem onClick={() => router.push("/managemodel")}>
                  Manage Models
                </MenuItem>
              </>
            ) : (
              <MenuItem onClick={() => router.push("/managemodel")}>
                View Models
              </MenuItem>
            )}
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ pt: 10, pb: 6 }}>
        <Card 
          elevation={3} 
          sx={{ 
            borderRadius: 2,
            overflow: 'visible',
            position: 'relative',
            "&::before": {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '8px',
              backgroundColor: "#861F41", // accent card color
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
            },
            mb: 3
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
                  color: "#861F41", // title text color
                }}
              >
                <ModelTrainingIcon sx={{ mr: 1 }} /> Train Model
              </Typography>
            </Box>
            
            {/* Display errors */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3 }}
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={(e) => { e.preventDefault(); handleTrain(); }}>
              {/* New model name */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 1, fontWeight: "medium" }}>
                  New Model Name *
                </Typography>
                <TextField
                  variant="outlined"
                  fullWidth
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  required
                  placeholder="Enter a name for your newly trained model"
                  InputProps={{
                    sx: { borderRadius: 1 }
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Enter a name for your newly trained model
                </Typography>
              </Box>
              
              {/* Training parameters side by side */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Epochs */}
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: "medium" }}>
                    Epochs *
                  </Typography>
                  <TextField
                    variant="outlined"
                    fullWidth
                    type="number"
                    value={epochVal}
                    onChange={(e) => setEpochVal(e.target.value)}
                    required
                    placeholder="1"
                    inputProps={{ min: 1 }}
                    InputProps={{
                      sx: { borderRadius: 1 }
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Number of training epochs (must be ≥ 1)
                  </Typography>
                </Grid>
                
                {/* K-Fold */}
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: "medium" }}>
                    K-Fold *
                  </Typography>
                  <TextField
                    variant="outlined"
                    fullWidth
                    type="number"
                    value={kfoldVal}
                    onChange={(e) => setKfoldVal(e.target.value)}
                    required
                    placeholder="2"
                    inputProps={{ min: 1 }}
                    InputProps={{
                      sx: { borderRadius: 1 }
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    K-Fold cross validation value (must be ≥ 1)
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 4 }} />
              
              {/* File upload */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "500" }}>
                  Upload Training Data
                </Typography>
                
                <Box
                  sx={{
                    border: '1px dashed #C95B0C',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {file ? (
                    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => setFile(null)}
                        sx={{ mb: 2 }}
                      >
                        CLEAR FILE
                      </Button>
                      
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        File selected ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                      
                      <Button
                        variant="contained"
                        sx={{
                          mt: 2,
                          borderRadius: 0,
                          backgroundColor: "#861F41",
                          "&:hover": {
                            backgroundColor: "#700a30",
                          },
                        }}
                        component="label"
                      >
                        CHANGE FILE
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
                      <CloudUploadIcon sx={{ fontSize: 64, color: '#861F41', mb: 2 }} />
                      
                      <Typography variant="h6" gutterBottom>
                        Drag and drop your CSV file here
                      </Typography>
                      
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
                          borderRadius: 0,
                          backgroundColor: "#861F41",
                          "&:hover": {
                            backgroundColor: "#700a30",
                          },
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
              
              {/* Submit button */}
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  startIcon={<PlayArrowIcon />}
                  sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: 0,
                    backgroundColor: "#861F41", // maroon button to match the theme
                    "&:hover": {
                      backgroundColor: "#700a30",
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