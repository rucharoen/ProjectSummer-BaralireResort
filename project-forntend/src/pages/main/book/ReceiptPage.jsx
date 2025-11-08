

const ReceiptPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Receipt</h1>
        <p className="text-gray-700 mb-2">Thank you for your purchase!</p>
        <p className="text-gray-600">Your order has been successfully processed.</p>
      </div>
    </div>
  );
}

export default ReceiptPage;