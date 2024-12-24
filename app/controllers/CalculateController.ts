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

        // Calculate weights
        const entryWeight = body.entryWeight;
        const exitWeight = body.exitWeight;
        const weightDiff = exitWeight;
        let roundedWeight;

        if (weightDiff >= 1000) {
            roundedWeight = Math.floor(weightDiff / 100) * 100;
        } else if (weightDiff >= 100) {
            roundedWeight = Math.floor(weightDiff / 10) * 10;
        } else {
            roundedWeight = Math.floor(weightDiff);
        }

        const calculation = {
            ticket_number: ticketNumber,
            vehicle_number: body.vehicleNumber,
            driver_name: body.driverName,
            owner_name: body.ownerName,
            entry_weight: entryWeight,
            exit_weight: exitWeight,
            price_per_kg: body.pricePerKg,
            net_weight: weightDiff,
            rounded_weight: roundedWeight,
            rounding_off: weightDiff - roundedWeight,
            total_price: roundedWeight * body.pricePerKg,
            entry_datetime: body.entryDateTime || Date.now(),
            exit_datetime: body.exitDateTime,
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
  
      // Calculate weights
      const weightDiff = body.entryWeight - body.exitWeight;
      let roundedWeight;
  
      if (weightDiff >= 1000) {
          roundedWeight = Math.floor(weightDiff / 100) * 100;
      } else if (weightDiff >= 100) {
          roundedWeight = Math.floor(weightDiff / 10) * 10;
      } else {
          roundedWeight = Math.floor(weightDiff);
      }
  
      const calculation = {
        ticket_number: body.ticketNumber,
        vehicle_number: body.vehicleNumber,
        driver_name: body.driverName,
        owner_name: body.ownerName,
        entry_weight: body.entryWeight,
        exit_weight: body.exitWeight,
        price_per_kg: body.pricePerKg,
        net_weight: weightDiff,
        rounded_weight: roundedWeight,
        rounding_off: weightDiff - roundedWeight,
        total_price: roundedWeight * body.pricePerKg,
        entry_datetime: body.entryDateTime,
        exit_datetime: Date.now(),
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
