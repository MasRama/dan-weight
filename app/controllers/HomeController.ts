import DB from "../services/DB"

class Controller {

  public async index(request, response) {
    return response.inertia("home");
  }

  public async dashboard(request, response) {
    return response.inertia("dashboard/home");
  }

  public async create(request, response) {
    
  }

  public async store(request, response) {
    
  }
    
  public async show(request, response) {
   
  }

  public async edit(request, response) {
    
  }

  public async update(request, response) {
    
  }

  public async destroy(request, response) {

  }

}

export default new Controller();
