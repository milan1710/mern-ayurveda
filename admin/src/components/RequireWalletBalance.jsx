import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function RequireWalletBalance({ children }) {
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkBalance = async () => {
      try {
        const { data } = await api.get("/auth/me");
        const user = data.user;

        if (!user) {
          navigate("/login");
          return;
        }

        // ✅ only check for sub_admin
        if (user.role === "sub_admin" && user.applyCharge) {
          const minRequired = user.orderCharge > 0 ? user.orderCharge : 20;
          if ((user.wallet || 0) < minRequired) {
            alert(`⚠️ Insufficient wallet balance! You need at least ₹${minRequired} to access orders.`);
            navigate("/wallet");
            setOk(false);
            return;
          }
        }

        // ✅ passed
        setOk(true);
      } catch (err) {
        console.error("Balance check failed:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkBalance();
  }, [navigate]);

  if (loading) return <div>Checking wallet balance...</div>;
  if (!ok) return null;   // 🚫 don't render children if not allowed

  return <>{children}</>;
}
