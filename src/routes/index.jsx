import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuth } from "../provider/authProvider";
import { ProtectedRoute } from "./ProtectedRoute";

// import Login from "../pages/login";
import Signout from "../pages/Signout";
import Welcome from "../pages/welcome";
import Dashboard from "../pages/Dashboard";
import Preferences from "../pages/Preferences";
import Profile from "../pages/Profile";
import AboutUs from "../pages/AboutUs";
import Signup from "../pages/Signup";
import Signin from "../pages/Signin";
import Matches from "../pages/Matches";

const Routes = () => {
  const { token } = useAuth();
  
  // Define public routes accessible to all users
  const routesForPublic = [
    {
      path: "/",
      element: <Welcome />,
    },
    {
      path: "/about",
      element: <AboutUs />,
    },
    {
      path: "/signup",
      element: <Signup />,
    },
    {
      path: "/signin",
      element: <Signin />,
    },
  ];

  // Define routes accessible only to authenticated users
  const routesForAuthenticatedOnly = [
    {
      path: "/",
      element: <ProtectedRoute />, // Wrap the component in ProtectedRoute
      children: [
        {
          path: "/",
          element: <Welcome />,
        },
        {
          path: "/dashboard",
          element: <Dashboard />,
        },
        {
          path: "/profile",
          element: <Profile />,
        },
        {
          path: "/preferences",
          element: <Preferences />,
        },
        {
          path: "/matches",
          element: <Matches />,
        },
        {
          path: "/signout",
          element: <Signout />,
        },
      ],
    },
  ];

  // Combine and conditionally include routes based on authentication status
  const router = createBrowserRouter([
    ...routesForPublic,
    // ...(!token ? routesForPublic : []),
    ...routesForAuthenticatedOnly,
  ]);

  // Provide the router configuration using RouterProvider
  return <RouterProvider router={router} />;
};

export default Routes;