"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Snackbar,
} from "@mui/material";

import {
  Menu as MenuIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Shield as ShieldIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

export default function AdminControlPanel() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [usernameToPromote, setUsernameToPromote] = useState("");
  const [searchUsername, setSearchUsername] = useState("");

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [userToRevoke, setUserToRevoke] = useState(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [mainMenuAnchor, setMainMenuAnchor] = useState(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const res = await fetch("/api/auth/user", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!res.ok) {
          router.push("/login");
          return;
        }

        const userData = await res.json();
        setUser(userData);
        if (userData.role !== "admin") {
          router.push("/");
          return;
        }
        setIsAdmin(true);
        fetchUsers();
      } catch (err) {
        console.error("Error checking admin status:", err);
        router.push("/");
      }
    };

    checkAdminStatus();
  }, [router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch users data");
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = async () => {
    if (!usernameToPromote.trim()) {
      setSnackbarMessage("Please enter a valid username");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      const res = await fetch("/api/admin/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: usernameToPromote }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to promote user");
      }

      setSnackbarMessage(
        `User "${usernameToPromote}" promoted to admin successfully`,
      );
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setUsernameToPromote("");
      setAddDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Error promoting user:", err);
      setSnackbarMessage(err.message || "Failed to promote user");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const revokeAdmin = async () => {
    if (!userToRevoke) {
      return;
    }
    try {
      const res = await fetch("/api/admin/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: userToRevoke._id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to revoke admin privileges");
      }

      setSnackbarMessage(
        `Admin privileges revoked from "${userToRevoke.username}"`,
      );
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setUserToRevoke(null);
      setRemoveDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Error revoking admin:", err);
      setSnackbarMessage(err.message || "Failed to revoke admin privileges");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleMainMenuOpen = (event) => {
    setMainMenuAnchor(event.currentTarget);
  };

  const handleMainMenuClose = () => {
    setMainMenuAnchor(null);
  };

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
    handleUserMenuClose();
  };

  const handleGoToHome = () => {
    router.push("/");
    handleMainMenuClose();
  };

  const handleGoToModels = () => {
    router.push("/managemodel");
    handleMainMenuClose();
  };

  const filteredUsers = searchUsername
    ? users.filter((user) =>
        user.username.toLowerCase().includes(searchUsername.toLowerCase()),
      )
    : users;

  const adminCount = users.filter((user) => user.role === "admin").length;

  // UI ELEMENTS

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fa",
      }}
    >
      {/* app bar to match home page */}
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
            onClick={handleMainMenuOpen}
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
            onClick={handleUserMenuOpen}
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
            onClose={handleUserMenuClose}
            sx={{ mt: 1 }}
          >
            {isAdmin && (
              <MenuItem
                onClick={() => {
                  router.push("/admin");
                  handleUserMenuClose();
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
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>

          {/*main menu*/}
          <Menu
            anchorEl={mainMenuAnchor}
            open={Boolean(mainMenuAnchor)}
            onClose={handleMainMenuClose}
            sx={{ mt: 1 }}
          >
            <MenuItem onClick={handleGoToHome}>Home</MenuItem>
            <MenuItem onClick={handleGoToModels}>Manage Models</MenuItem>
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
              backgroundColor: "#861F41",
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
                <ShieldIcon sx={{ color: "#861F41", mr: 1, fontSize: 28 }} />
                <Typography
                  variant="h5"
                  component="h1"
                  sx={{
                    fontWeight: "bold",
                    color: "#861F41",
                  }}
                >
                  Admin Control Panel
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setAddDialogOpen(true)}
                sx={{
                  borderRadius: 2,
                  backgroundColor: "#861F41",
                  "&:hover": {
                    backgroundColor: "#861F41",
                  },
                  textTransform: "none",
                }}
              >
                Add Admin
              </Button>
            </Box>

            {/*summary status*/}
            <Box
              sx={{
                display: "flex",
                gap: 3,
                mb: 4,
                flexWrap: "wrap",
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  flex: 1,
                  minWidth: 200,
                  backgroundColor: "#e8eaf6",
                  border: "1px solid #c5cae9",
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6" sx={{ mb: 1, color: "#861F41" }}>
                  Total Users
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                  {users.length}
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  flex: 1,
                  minWidth: 200,
                  backgroundColor: "#e8eaf6",
                  border: "1px solid #c5cae9",
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6" sx={{ mb: 1, color: "#861F41" }}>
                  Admin Users
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: "bold" }}>
                  {adminCount}
                </Typography>
              </Paper>
            </Box>

            {/* Search Bar */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search users by username..."
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: "action.active", mr: 1 }} />
                  ),
                  sx: { borderRadius: 2 },
                }}
                variant="outlined"
              />
            </Box>

            {/* Users Table */}
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
                        Username
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow
                          key={user._id}
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
                            {user.username}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.role || "user"}
                              color={
                                user.role === "admin" ? "black" : "default"
                              }
                              variant={
                                user.role === "admin" ? "filled" : "outlined"
                              }
                              sx={{
                                fontWeight:
                                  user.role === "admin" ? "bold" : "normal",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {user.role === "admin" && (
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<PersonRemoveIcon />}
                                onClick={() => {
                                  setUserToRevoke(user);
                                  setRemoveDialogOpen(true);
                                }}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: "none",
                                }}
                                disabled={user.username === "admin"} // Prevent removing the main admin
                              >
                                Remove Admin
                              </Button>
                            )}
                            {user.role !== "admin" && (
                              <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                startIcon={<PersonAddIcon />}
                                onClick={() => {
                                  setUsernameToPromote(user.username);
                                  setAddDialogOpen(true);
                                }}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: "none",
                                }}
                              >
                                Make Admin
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                          {searchUsername
                            ? "No users found matching your search."
                            : "No users found."}
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

      {/* Add Admin Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogTitle sx={{ color: "#861F41" }}>Add Admin User</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter the username of the user you want to promote to admin:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            type="text"
            fullWidth
            variant="outlined"
            value={usernameToPromote}
            onChange={(e) => setUsernameToPromote(e.target.value)}
            InputProps={{ sx: { borderRadius: 1 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setAddDialogOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={makeAdmin}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              backgroundColor: "#861F41",
            }}
          >
            Promote to Admin
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Admin Dialog */}
      <Dialog
        open={removeDialogOpen}
        onClose={() => setRemoveDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
      >
        <DialogTitle sx={{ color: "#d32f2f" }}>
          Remove Admin Privileges
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove admin privileges from user "
            {userToRevoke?.username}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setRemoveDialogOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={revokeAdmin}
            variant="contained"
            color="error"
            sx={{
              borderRadius: 2,
              textTransform: "none",
            }}
          >
            Remove Admin
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

