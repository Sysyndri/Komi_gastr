const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();
(async()=>{
 const u=await p.user.findMany({select:{email:true,role:true}});
 console.log("USERS "+JSON.stringify(u));
 console.log("ADMIN_ENV "+JSON.stringify({e:process.env.SEED_ADMIN_EMAIL,p:process.env.SEED_ADMIN_PASSWORD?"set":"unset"}));
 process.exit(0);
})().catch(e=>{console.error("ERR "+e.message);process.exit(1)});
