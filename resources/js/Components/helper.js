import Toastify from "toastify-js";

export function Toast(text, type = "success", duration = 3000) {
  if(type == "success") {
    Toastify({
      text: text,
      duration: duration,
      gravity: "top",
      position: "right",
      style: {
        background: "#00ACEE",
        color: "#FFFFFF",
        boxShadow: "0 4px 6px -1px rgba(0, 172, 238, 0.2)",
        borderRadius: "8px",
        padding: "12px 24px",
        fontSize: "14px",
        fontWeight: "500"
      },
      onClick: function(){} 
    }).showToast();
  }

  if(type == "error") {
    Toastify({
      text: text,
      duration: duration,
      gravity: "top",
      position: "right",
      style: {
        background: "#DC2626",
        color: "#FFFFFF",
        boxShadow: "0 4px 6px -1px rgba(220, 38, 38, 0.2)",
        borderRadius: "8px",
        padding: "12px 24px",
        fontSize: "14px",
        fontWeight: "500"
      },
      onClick: function(){} 
    }).showToast();
  }
}









