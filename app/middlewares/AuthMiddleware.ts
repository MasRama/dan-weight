import DB from "../services/DB";

export default async (request: any, response: any) => {
    try {
        
        if (request.cookies.auth_id) {
            const session = await DB.from("sessions")
                .where("id", request.cookies.auth_id)
                .where("expires_at", ">", DB.raw('CURRENT_TIMESTAMP'))
                .first();

            if (session) {
                const user = await DB.from("users")
                    .where("id", session.user_id)
                    .select([
                        "id",
                        "nama",
                        "email",
                        "api_key"
                    ])
                    .first();

                // If we're trying to access login/register pages with valid session
                if (request.path === '/login' || request.path === '/register') {
                    response.redirect('/dashboard');
                    return false;
                }

                request.user = user;
                request.share = {
                    "user": request.user
                };
                return true;
            }
        }
        
        response.clearCookie("auth_id", { path: '/' });
        response.redirect("/login");
        return false;
    } catch (error) {
        console.log('Auth error:', error);
        response.clearCookie("auth_id", { path: '/' });
        response.redirect("/login");
        return false;
    }
}
