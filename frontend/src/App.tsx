import React from "react";
import ConnectWallet from "./components/ConnectWallet";
import CreateGrade from "./components/CreateGrade";
import ViewInformation from "./components/ViewInformation";
import AccessManagement from "./components/AccessManagement";
import VerificationPanel from "./components/VerificationPanel";

export default function App() {
  return (
    <div className="container">
      <h2>Scholarkey &#128273; Frontend</h2>
      <ConnectWallet />
      <hr />
      <CreateGrade />
      <ViewInformation />
      <VerificationPanel />
      <AccessManagement />
    </div>
  );
}
