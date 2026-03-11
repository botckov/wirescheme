import React, { useEffect, useRef, useState } from 'react';

interface ToastProps {
  message: string | null;
  onClear: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClear }) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (message) {
      setVisible(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(onClear, 300);
      }, 2200);
    }
    return () => clearTimeout(timerRef.current);
  }, [message]); // eslint-disable-line

  if (!message) return null;

  return (
    <div className={`ws-toast${visible ? ' show' : ''}`}>
      {message}
    </div>
  );
};

export default Toast;
