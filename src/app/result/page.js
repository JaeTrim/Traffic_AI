"use client";

//maroon: 861F41
//orange: C95B0C

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ModelTrainingIcon from "@mui/icons-material/ModelTraining";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import {
  Box,
  Typography,
  Button,
  Container,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Paper,
} from "@mui/material";

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modelOutput, setModelOutput] = useState(null);
  const [modelName, setModelName] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Menu states
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [mainMenuAnchor, setMainMenuAnchor] = useState(null);

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
        
        // If user is not an admin, redirect to home
        if (data && data.role !== "admin") {
          toast.error("You don't have permission to view this page.");
          router.push("/");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchUser();
  }, [searchParams, router]);

  const handleAccept = async () => {
    // Check if user is admin before proceeding
    if (!user || user.role !== "admin") {
      toast.error("You don't have permission to perform this action.");
      return;
    }
    
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    // Check if user is admin before proceeding
    if (!user || user.role !== "admin") {
      toast.error("You don't have permission to perform this action.");
      return;
    }
    
    toast("Model rejected. Try training again.");
    router.push("/trainmodel");
  };

  // Menu handlers
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

  const goModels = () => {
    router.push("/managemodel");
    mainMenuClose();
  };

  const goNewModel = () => {
    // Check if user is admin before navigating
    if (!user || user.role !== "admin") {
      toast.error("You don't have permission to add new models.");
      return;
    }
    router.push("/newmodel");
    mainMenuClose();
  };

  const goTrainModel = () => {
    // Check if user is admin before navigating
    if (!user || user.role !== "admin") {
      toast.error("You don't have permission to train models.");
      return;
    }
    router.push("/trainmodel");
    mainMenuClose();
  };

  const isAdmin = user && user.role === "admin";

  if (error) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
        <AppBar position="fixed" elevation={3} sx={{ backgroundColor: "#861F41" }}>
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
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: "bold" }}>
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
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ pt: 12, pb: 6 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Box>
    );
  }

  if (!modelOutput) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
        <AppBar position="fixed" elevation={3} sx={{ backgroundColor: "#861F41" }}>
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
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: "bold" }}>
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
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ pt: 12, pb: 6, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
      {/* App Bar */}
      <AppBar position="fixed" elevation={3} sx={{ backgroundColor: "#861F41" }}>
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
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: "bold" }}>
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

          {/* User Menu */}
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

          {/* Main Menu */}
          <Menu
            anchorEl={mainMenuAnchor}
            open={Boolean(mainMenuAnchor)}
            onClose={mainMenuClose}
            sx={{ mt: 1 }}
          >
            <MenuItem onClick={goHome}>Home</MenuItem>
            {isAdmin ? (
              <>
                <MenuItem onClick={goNewModel}>Add New Model</MenuItem>
                <MenuItem onClick={goModels}>Manage Models</MenuItem>
                <MenuItem onClick={goTrainModel}>Train Model</MenuItem>
              </>
            ) : (
              <MenuItem onClick={goModels}>View Models</MenuItem>
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
              backgroundColor: "#861F41", // accent color
              borderTopLeftRadius: "8px",
              borderTopRightRadius: "8px",
            },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
              <IconButton
                onClick={() => router.push("/trainmodel")}
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
                <ModelTrainingIcon sx={{ mr: 1 }} /> Training Results
              </Typography>
            </Box>

            <Box
              sx={{
                mb: 4,
                p: 3,
                backgroundColor: "#f8f9fa",
                borderRadius: 2,
                border: "1px solid #e0e0e0",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "#861F41", mb: 2 }}
              >
                {modelName}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Review the model performance metrics below. If the results are satisfactory, 
                click Accept to save the model. Otherwise, click Reject to return to the training page.
              </Typography>
            </Box>

            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: "#fff",
                mb: 4,
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: "#861F41", mb: 3, fontWeight: 500 }}
              >
                Performance Metrics
              </Typography>
              
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: "#f5f5f5" 
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Average Train MSE:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {modelOutput.result?.["Average Train MSE"]}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: "#f5f5f5" 
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Average Train MAE:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {modelOutput.result?.["Average Train MAE"]}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: "#f5f5f5" 
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    Average Train R²:
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {modelOutput.result?.["Average Train R²"]}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ 
              display: "flex", 
              justifyContent: "center", 
              gap: 3,
              mt: 2
            }}>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<CheckCircleIcon />}
                onClick={handleAccept}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: 3,
                  backgroundColor: "#43a047",
                  "&:hover": {
                    backgroundColor: "#2e7d32",
                  },
                  textTransform: "none",
                  fontWeight: 500,
                }}
              >
                {loading ? "Saving..." : "Accept Model"}
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                size="large"
                startIcon={<CancelIcon />}
                onClick={handleReject}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: 3,
                  borderColor: "#d32f2f",
                  color: "#d32f2f",
                  "&:hover": {
                    backgroundColor: "#ffebee",
                    borderColor: "#c62828",
                  },
                  textTransform: "none",
                  fontWeight: 500,
                }}
              >
                Reject Model
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}