import React, { useState } from 'react';
import { useStripeConnect } from '../lib/useStripeConnect';
import { ExternalLink } from 'lucide-react';

export default function PaymentButton({ 
  session, 
  coachId, 
  amount, 
  description, 
  lessonId, 
  studentEmail,
  className = "" 
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { createCheckout } = useStripeConnect(session);

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);
      await createCheckout({
        coachId,
        amount,
        description,
        lessonId,
        studentEmail,
        studentId: session?.user?.id,
      });
      // createCheckout will redirect to Stripe, so we don't necessarily need to set processing back to false unless it fails
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  const formattedAmount = typeof amount === 'number' ? amount.toFixed(2) : amount;

  return (
    <button
      onClick={handleCheckout}
      disabled={isProcessing}
      className={`bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm shadow-primary/20 flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
    >
      {isProcessing ? 'Processing...' : `Pay $${formattedAmount}`}
      {!isProcessing && <ExternalLink size={16} />}
    </button>
  );
}
