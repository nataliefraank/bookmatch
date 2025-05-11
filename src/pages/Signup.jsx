import { auth } from '../../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useFormik } from "formik";
import { useNavigate } from 'react-router-dom';
import '../App.css';
import '../index.css';
import { Button } from 'flowbite-react';

const validate = (values) => {
  const errors = {};
  if (!values.firstName) {
    errors.firstName = "First Name cannot be empty";
  } else if (values.firstName.length > 15) {
    errors.firstName = "Must be 15 characters or less";
  }

  if (!values.lastName) {
    errors.lastName = "Last Name cannot be empty";
  } else if (values.lastName.length > 20) {
    errors.lastName = "Must be 20 characters or less";
  }

  if (!values.email) {
    errors.email = "Email is required";
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    errors.email = "Invalid email address";
  }

  if (!values.password) {
    errors.password = "Password is required";
  } else if (values.password.length < 8) {
    errors.password = "Password must not be less than 8 characters";
  }

  return errors;
};

function SignUp() {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
    validate,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      try {
        await createUserWithEmailAndPassword(auth, values.email, values.password);
        console.log("Signed up. Navigating to dashboard.");
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error(error);
        setErrors({ email: "Sign-up failed. Try a different email." }); // basic error handling
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div>
      <h2>Register your Account</h2>
      <form onSubmit={formik.handleSubmit}>
        <input
          type="text"
          placeholder="First Name"
          name="firstName"
          onChange={formik.handleChange}
          value={formik.values.firstName}
        />
        {formik.errors.firstName && <div className="error">{formik.errors.firstName}</div>}

        <input
          type="text"
          placeholder="Last Name"
          name="lastName"
          onChange={formik.handleChange}
          value={formik.values.lastName}
        />
        {formik.errors.lastName && <div className="error">{formik.errors.lastName}</div>}

        <input
          type="email"
          placeholder="Email Address"
          name="email"
          onChange={formik.handleChange}
          value={formik.values.email}
        />
        {formik.errors.email && <div className="error">{formik.errors.email}</div>}

        <input
          type="password"
          placeholder="Password"
          name="password"
          onChange={formik.handleChange}
          value={formik.values.password}
        />
        {formik.errors.password && <div className="error">{formik.errors.password}</div>}

        <Button type="submit" color="dark" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? 'Registering...' : 'Register'}
        </Button>
      </form>

      <p className="terms-text">
        By clicking the button, you are agreeing to our&nbsp;
        <a href="#">Terms and Services</a>
      </p>
    </div>
  );
}

export default SignUp;
