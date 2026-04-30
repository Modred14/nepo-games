import pool from "@/lib/db";

export const getUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT 
      id,
      email,
      first_name,
      surname,
      username,
      profile_image,
      phone_verified,
      plan,
      subscription_status,
      subscription_start,
      subscription_end,
      payment_provider
     FROM users
     WHERE email = $1`,
    [email]
  );

  return result.rows[0] || null;
};

export const computeIsVerified = (user) => {
  return (
    (user.subscription_status || "").toLowerCase() === "active" &&
    user.subscription_end &&
    new Date(user.subscription_end).getTime() > Date.now()
  );
};

export const mapUserResponse = (user) => {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    surname: user.surname,
    username: user.username,
    profile_image: user.profile_image,
    phone_verified: user.phone_verified,
    plan: user.plan,
    subscription_status: user.subscription_status,
    subscription_start: user.subscription_start,
    subscription_end: user.subscription_end,
    payment_provider: user.payment_provider,
    is_verified: computeIsVerified(user),
  };
};