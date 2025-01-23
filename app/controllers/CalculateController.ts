import DB from "../services/DB";

class Controller {

  public async index(request, response) {
    return response.inertia("dashboard/calculate", {
        title: "Kalkulasi Berat",
        description: "Sistem penimbangan modern untuk efisiensi bisnis Anda",
    });
  }
    
  public async store(request, response) {
    try {
        const body = await request.json();

        // Get current date parts
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2); // Get last 2 digits of year
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Get month (1-12) and pad with 0

        // Get the latest ticket number for current year and month
        const latestTicket = await DB('calculations')
            .where('ticket_number', 'like', `${year}${month}%`)
            .orderBy('ticket_number', 'desc')
            .first();

        let sequence = '01';
        if (latestTicket) {
            const lastSequence = parseInt(latestTicket.ticket_number.slice(-2));
            sequence = (lastSequence + 1).toString().padStart(2, '0');
        }

        const ticketNumber = `${year}${month}${sequence}`;

        // Use raw weight without vehicle weight subtraction
        const entryWeight = body.entryWeight;

        const calculation = {
            ticket_number: ticketNumber,
            vehicle_number: body.vehicleNumber,
            driver_name: body.driverName,
            owner_name: body.ownerName,
            entry_weight: entryWeight,
            net_weight: entryWeight,
            price_per_kg: body.pricePerKg,
            total_price: (entryWeight / 1000) * body.pricePerKg, // Convert grams to kg for price calculation
            entry_datetime: body.entryDateTime || Date.now(),
            user_id: body.userId,
            types: body.types
        };

        const [id] = await DB('calculations').insert(calculation);

        return response.json({
            success: true,
            message: 'Entry data saved successfully',
            data: {
                id,
                ...calculation
            }
        });

    } catch (error) {
        console.error('Entry error:', error);
        return response.json({
            success: false,
            message: 'Failed to save entry data',
            error: error.message
        }, 500);
    }
}



public async edit(request, response) {
    try {
      const body = await request.json();
      const id = body.id;
  
      // Handle both entry and exit weights (already in grams from frontend)
      const entryWeight = body.entryWeight;
      const exitWeight = body.exitWeight || null;
  
      // Calculate net weight as entry weight minus exit weight
      const netWeight = exitWeight ? entryWeight - exitWeight : entryWeight;
  
      const calculation = {
        ticket_number: body.ticketNumber,
        vehicle_number: body.vehicleNumber,
        driver_name: body.driverName,
        owner_name: body.ownerName,
        entry_weight: entryWeight,
        exit_weight: exitWeight,
        net_weight: netWeight,
        price_per_kg: body.pricePerKg,
        total_price: (netWeight / 1000) * body.pricePerKg, // Calculate based on net weight
        entry_datetime: body.entryDateTime,
        exit_datetime: exitWeight ? Date.now() : null,
        user_id: body.userId,
        types: body.types
      };
  
      await DB('calculations').where('id', id).update(calculation);
  
      return response.json({
        success: true,
        message: 'Calculation updated successfully',
        data: {
          id,
          ...calculation
        }
      });
  
    } catch (error) {
      console.error('Update calculation error:', error);
      return response.json({
        success: false,
        message: 'Failed to update calculation',
        error: error.message
      }, 500);
    }
  }
  
  

  // Add this new method to your existing Controller class
public async history(request, response) {
  try {
      const calculations = await DB('calculations')
          .select('*')
          .orderBy('entry_datetime', 'desc');

      return response.json({
          success: true,
          data: calculations
      });
  } catch (error) {
      console.error('Fetch calculations error:', error);
      return response.json({
          success: false,
          message: 'Failed to fetch calculations',
          error: error.message
      }, 500);
  }
}


  public async historyPage(request, response) {
    return response.inertia("dashboard/calculateHistory")
  }

  public async destroy(request, response) {

  }

  public async destroyAll(request, response) {
    try {
      await DB('calculations').truncate();
      
      return response.json({
        success: true,
        message: 'All calculations deleted successfully'
      });
    } catch (error) {
      console.error('Delete all calculations error:', error);
      return response.json({
        success: false,
        message: 'Failed to delete all calculations',
        error: error.message
      }, 500);
    }
  }

}

export default new Controller();
