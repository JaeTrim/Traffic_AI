"use client";

//colors:
//maroon: 861F41
//orange: C95B0C

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Container,
  Card,
  CardContent,
  Chip,
  TextField,
  Tooltip,
} from "@mui/material";

import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Menu as MenuIcon,
  ModelTraining as ModelTrainingIcon,
  Edit as EditIcon,
  RemoveCircle as RemoveIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";

export default function ModelPage() {
  const router = useRouter();
  const [models, setModels] = useState([]);
  const [loading, setloading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    model: null,
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userMenu, setUserMenu] = useState(null);
  const [mainMenu, setMainMenu] = useState(null);
  const [editDialog, setEditDialog] = useState({
    open: false,
    model: null,
    name: "",
    inputs: [],
    file: null,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      //api header
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
        setCurrentUser({
          id: data.userId,
          name: data.username,
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const token = getCookie("token");
        if (!token) {
          throw new Error("User not authenticated. Please log in.");
        }
        const response = await fetch("/api/models", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch models.");
        }
        const data = await response.json();
        const formattedModels = data.map((model) => ({
          id: model._id,
          name: model.name,
          inputs: model.inputFields || [],
          filePath: model.filePath || "No file uploaded",
          createdAt: new Date(model.createdAt).toLocaleString(),
        }));
        setModels(formattedModels);
      } catch (err) {
        console.error("Error fetching models:", err);
        setError(err.message || "Failed to fetch models.");
        showNotification(err.message || "Failed to fetch models.", "error");
      } finally {
        setloading(false);
      }
    };

    fetchModels();
  }, []);

  const openDeleteDialog = (model) => {
    setDeleteDialog({
      open: true,
      model: model,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      model: null,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.model) {
      return;
    }
    try {
      const token = getCookie("token");
      if (!token) {
        throw new Error("User not authenticated. Please log in.");
      }
      const response = await fetch(
        `/api/models?modelId=${encodeURIComponent(deleteDialog.model.id)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete the model.");
      }

      setModels((prevModels) =>
        prevModels.filter((m) => m.id !== deleteDialog.model.id)
      );

      showNotification("Model deleted successfully.", "success");
    } catch (err) {
      console.error("Failed to delete model:", err);
      setError(err.message || "Failed to delete the model.");
      showNotification(err.message || "Failed to delete the model.", "error");
    } finally {
      closeDeleteDialog();
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({
      open: true,
      message: message,
      type: type,
    });
  };

  const closeNotification = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  const openUserMenu = (event) => {
    setUserMenu(event.currentTarget);
  };

  const closeUserMenu = () => {
    setUserMenu(null);
  };

  const openMainMenu = (event) => {
    setMainMenu(event.currentTarget);
  };

  const closeMainMenu = () => {
    setMainMenu(null);
  };

  const logout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
    closeUserMenu();
  };

  const goHome = () => {
    router.push("/");
    closeMainMenu();
  };

  const addModel = () => {
    router.push("/newmodel");
  };

  const navigateToAddModel = () => {
    router.push("/newmodel");
    closeMainMenu();
  };
  //   const navigateToModelsList = () => {
  //     router.push("/managemodel");
  //     closeMainMenu();
  //   };

  const navigateToTrainModel = () => {
    router.push("/trainmodel");
    closeMainMenu();
  };

  const openEditDialog = (model) => {
    setEditDialog({
      open: true,
      model: model,
      name: model.name,
      inputs: model.inputs || [],
      file: null,
    });
  };

  const closeEditDialog = () => {
    setEditDialog({
      open: false,
      model: null,
      name: "",
      inputs: [],
      file: null,
    });
  };

  const updateModelName = (e) => {
    setEditDialog({
      ...editDialog,
      name: e.target.value,
    });
  };

  const updateInputField = (index, value) => {
    const updatedInputs = [...editDialog.inputs];
    updatedInputs[index] = value;
    setEditDialog({
      ...editDialog,
      inputs: updatedInputs,
    });
  };

  const addInputField = () => {
    setEditDialog({
      ...editDialog,
      inputs: [...editDialog.inputs, ""],
    });
  };

  const removeInputField = (index) => {
    if (editDialog.inputs.length === 1) return;
    const updatedInputs = editDialog.inputs.filter((_, i) => i !== index);
    setEditDialog({
      ...editDialog,
      inputs: updatedInputs,
    });
  };

  const uploadFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setEditDialog({
        ...editDialog,
        file: e.target.files[0],
      });
    }
  };

  const saveChanges = async () => {
    if (!editDialog.name.trim()) {
      setError("Model name is required.");
      return;
    }

    if (editDialog.inputs.some((input) => !input.trim())) {
      setError("All input fields must be filled.");
      return;
    }

    try {
      const token = getCookie("token");
      if (!token) {
        throw new Error("User not authenticated. Please log in.");
      }

      let response;
      if (editDialog.file) {
        const formData = new FormData();
        formData.append("name", editDialog.name);
        formData.append("inputFields", JSON.stringify(editDialog.inputs));
        formData.append("modelFile", editDialog.file);

        response = await fetch(`/api/models/${editDialog.model.id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: formData,
        });
      } else {
        response = await fetch(`/api/models/${editDialog.model.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            name: editDialog.name,
            inputFields: editDialog.inputs,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update model.");
      }

      const updatedModel = await response.json();

      setModels(
        models.map((m) =>
          m.id === editDialog.model.id
            ? {
                ...m,
                name: updatedModel.name,
                inputs: updatedModel.inputFields,
                filePath: updatedModel.filePath || m.filePath,
              }
            : m
        )
      );

      showNotification("Model updated successfully.", "success");
      closeEditDialog();
    } catch (err) {
      console.error("Error updating model:", err);
      setError(err.message || "Failed to update the model.");
      showNotification(err.message || "Failed to update the model.", "error");
    }
  };

  const getCookie = (name) => {
    if (typeof window === "undefined") {
      return null;
    }
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(";").shift();
    }
    return null;
  };

  const getFileName = (filePath) => {
    if (!filePath || filePath === "No file uploaded") {
      return "No file";
    }
    const parts = filePath.split("/");
    return parts[parts.length - 1];
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fa",
      }}
    >
      {/*bar to match the home page*/}
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
            onClick={openMainMenu}
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
            onClick={openUserMenu}
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
            {currentUser ? currentUser.name : "User"}
          </Button>

          {/*user menu*/}
          <Menu
            anchorEl={userMenu}
            open={Boolean(userMenu)}
            onClose={closeUserMenu}
            sx={{ mt: 1 }}
          >
            <MenuItem onClick={logout}>Logout</MenuItem>
          </Menu>

          {/*main menu*/}
          <Menu
            anchorEl={mainMenu}
            open={Boolean(mainMenu)}
            onClose={closeMainMenu}
            sx={{ mt: 1 }}
          >
            <MenuItem onClick={goHome}>Home</MenuItem>
            <MenuItem onClick={navigateToAddModel}>Add New Model</MenuItem>
            <MenuItem onClick={navigateToTrainModel}>Train Model</MenuItem>
            {/* <MenuItem onClick={navigateToModelsList}>View All Models</MenuItem> */}
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 10, pb: 6 }}>
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
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 4,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <ModelTrainingIcon
                  sx={{ color: "#861F41", mr: 1, fontSize: 28 }}
                />
                <Typography
                  variant="h5"
                  component="h1"
                  sx={{
                    fontWeight: "bold",
                    color: "#861F41",
                  }}
                >
                  Manage Models
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addModel}
                sx={{
                  borderRadius: 2,
                  backgroundColor: "#861F41", //add new model color
                  "&:hover": {
                    backgroundColor: "#861F41",
                  },
                  textTransform: "none",
                }}
              >
                New Model
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", my: 8 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ my: 2 }}>
                {error}
              </Alert>
            ) : (
              <TableContainer
                component={Paper}
                elevation={2}
                sx={{ borderRadius: 2, overflow: "hidden" }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Model Name
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Input Fields
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>File</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Date Created
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {models.length > 0 ? (
                      models.map((model) => (
                        <TableRow
                          key={model.id}
                          sx={{
                            "&:nth-of-type(odd)": {
                              backgroundColor: "#f8f9fa",
                            },
                            "&:hover": {
                              backgroundColor: "#e8eaf6",
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 500 }}>
                            {model.name}
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                              }}
                            >
                              {model.inputs && model.inputs.length > 0 ? (
                                model.inputs.map((field, index) => (
                                  <Chip
                                    key={index}
                                    label={field}
                                    size="small"
                                    variant="outlined"
                                    sx={{ marginRight: 0.5, marginBottom: 0.5 }}
                                  />
                                ))
                              ) : (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  No input fields defined
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {model.filePath &&
                            model.filePath !== "No file uploaded" ? (
                              <Tooltip title={model.filePath}>
                                <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
                                  <FileIcon
                                    color="primary"
                                    fontSize="small"
                                    sx={{ mr: 1 }}
                                  />
                                  <Typography variant="body2">
                                    {getFileName(model.filePath)}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No file uploaded
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{model.createdAt}</TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                justifyContent: "center",
                              }}
                            >
                              <IconButton
                                color="primary"
                                onClick={() => openEditDialog(model)}
                                size="small"
                                sx={{
                                  border: "1px solid rgba(25, 118, 210, 0.5)",
                                  borderRadius: 1,
                                  mr: 1,
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => openDeleteDialog(model)}
                                size="small"
                                sx={{
                                  border: "1px solid rgba(211, 47, 47, 0.5)",
                                  borderRadius: 1,
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Box sx={{ textAlign: "center", py: 3 }}>
                            <ModelTrainingIcon
                              sx={{ fontSize: 48, color: "#C95B0C", mb: 2 }}
                            />
                            <Typography variant="h6" gutterBottom>
                              No models found
                            </Typography>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{ mb: 3 }}
                            >
                              Add a model to get started
                            </Typography>
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={addModel}
                              sx={{
                                borderRadius: 2,
                                backgroundColor: "#861F41", //add new model button
                                "&:hover": {
                                  backgroundColor: "#861F41",
                                },
                                textTransform: "none",
                              }}
                            >
                              Add New Model
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={closeDeleteDialog}
        aria-labelledby="confirm-delete-dialog-title"
        aria-describedby="confirm-delete-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 2,
            padding: 1,
          },
        }}
      >
        <DialogTitle id="confirm-delete-dialog-title" sx={{ color: "#d32f2f" }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-delete-dialog-description">
            Are you sure you want to delete the model "
            <strong>{deleteDialog.model?.name}</strong>"? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: 2 }}>
          <Button
            onClick={closeDeleteDialog}
            sx={{
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            autoFocus
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            Delete Model
          </Button>
        </DialogActions>
      </Dialog>

      {/*edit model*/}
      <Dialog
        open={editDialog.open}
        onClose={closeEditDialog}
        aria-labelledby="edit-model-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: 2,
            padding: 1,
            minWidth: "500px",
          },
        }}
      >
        <DialogTitle
          id="edit-model-dialog-title"
          sx={{ color: "#1a237e", fontWeight: "bold" }}
        >
          Edit Model
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
            Model Name
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            variant="outlined"
            value={editDialog.name}
            onChange={updateModelName}
            sx={{ mb: 3 }}
            InputProps={{
              sx: { borderRadius: 1 },
            }}
          />

          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
            Input Fields (Ordered)
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: "#f8f9fa",
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              mb: 2,
            }}
          >
            {editDialog.inputs.map((input, index) => (
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
                  onChange={(e) => updateInputField(index, e.target.value)}
                  placeholder="Input parameter name"
                  required
                  size="small"
                  InputProps={{
                    sx: { borderRadius: 1 },
                  }}
                />
                <IconButton
                  aria-label="remove input"
                  onClick={() => removeInputField(index)}
                  disabled={editDialog.inputs.length === 1}
                  sx={{ ml: 1 }}
                  color="error"
                  size="small"
                >
                  <RemoveIcon />
                </IconButton>
              </Box>
            ))}

            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addInputField}
                size="small"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                }}
              >
                Add Input Field
              </Button>
            </Box>
          </Paper>

          {/*for file upload*/}
          <Typography
            variant="subtitle1"
            sx={{ mt: 3, mb: 2, fontWeight: 500 }}
          >
            Replace Model File (Optional)
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: 3,
              border: "2px dashed #c5cae9",
              borderRadius: 2,
              backgroundColor: "#f5f5f5",
              textAlign: "center",
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: "#1a237e", mb: 2 }} />

            {editDialog.file ? (
              <Box sx={{ width: "100%" }}>
                <Chip
                  label={editDialog.file.name}
                  color="primary"
                  onDelete={() => setEditDialog({ ...editDialog, file: null })}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="primary">
                  New file selected (
                  {(editDialog.file.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              </Box>
            ) : (
              <>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Upload a new model file to replace the existing one
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  or keep the existing file
                </Typography>
              </>
            )}

            <Button
              variant="contained"
              component="label"
              sx={{
                borderRadius: 2,
                backgroundColor: editDialog.file ? "#4caf50" : "#1a237e",
                "&:hover": {
                  backgroundColor: editDialog.file ? "#388e3c" : "#303f9f",
                },
                textTransform: "none",
              }}
            >
              {editDialog.file ? "Change File" : "Browse Files"}
              <input
                type="file"
                hidden
                onChange={uploadFile}
                accept=".keras,.h5"
              />
            </Button>

            {!editDialog.file && (
              <Typography
                variant="body2"
                sx={{ mt: 2, color: "text.secondary" }}
              >
                Only .keras and .h5 files are accepted
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: 2 }}>
          <Button
            onClick={closeEditDialog}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={saveChanges}
            color="primary"
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
              backgroundColor: "#1a237e",
              "&:hover": {
                backgroundColor: "#303f9f",
              },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/*notifications*/}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeNotification}
          severity={notification.type}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
