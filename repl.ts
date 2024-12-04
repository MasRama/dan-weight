import DB from "./app/services/DB"; 
 
(async()=>{

  console.log(
    await DB('calculations').select()
  )
  process.exit(1)
})()
 