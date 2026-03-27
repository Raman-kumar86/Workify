import UserProfile from "../User/UserProfile";

const AdminProfile = () => {
  return (
    <UserProfile
      homePath="/admin"
      pageTitle="Admin Profile"
      paymentsPath="/user/payments"
    />
  );
};

export default AdminProfile;
