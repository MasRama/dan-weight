import DB from "../services/DB";

export default async (request: any, response: any) => {
    try {
        const body = await request.json();
        const apiKey = body.api_key;
        
        if (!apiKey) {
            response.status(401).json({
                status: false,
                message: 'API Key is required'
            });
            return false;
        }

        const user = await DB.from("users")
            .where("api_key", apiKey)
            .select([
                "id",
                "nama",
                "email",
                "api_key"
            ])
            .first();

        if (!user) {
            response.status(401).json({
                status: false,
                message: 'Invalid API Key'
            });
            return false;
        }

        request.user = user;
        return true;

    } catch (error) {
        console.log('API Auth error:', error);
        response.status(500).json({
            status: false,
            message: 'Internal server error'
        });
        return false;
    }
}
