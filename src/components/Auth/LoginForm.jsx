import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const LoginForm = () => {
  const { login } = useAuth();
  const { mergeCartsAfterLogin } = useCart();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      await mergeCartsAfterLogin();
      // Handle successful login
    } catch (error) {
      // Handle error
    }
  };

  // ...rest of the component
};
