import { Inngest } from "inngest";
import User from "../models/user.js";
import Connection from "../models/connection.js";
import sendEmail from "../configs/nodemailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "pingup-app" });


// Inngest Function to save user data to a database
const SyncUserCreation = inngest.createFunction(
    {id:'sync-user-from-clerk'},
    {event:'clerk/user.created'},
    async({event})=>{
        const{id , first_name , last_name , email_addresses , image_url}=event.data
        let username = email_addresses[0].email_address.split('@')[0]

        //Check availabilty of username
        const user = await User.findOne({username})

        if(user){
            username= username + Math.floor(Math.random()*1000)
        }
        const userData = {
            _id:id,
            email :  email_addresses[0].email_address,
            full_name : first_name + "" + last_name,
            profile_picture : image_url,
            username
        }
        await User.create(userData)
    }
)


// Inngest function to update the userdta in database
const SyncUserUpdation = inngest.createFunction(
    {id:'update-user-from-clerk'},
    {event:'clerk/user.updated'},
    async({event})=>{
        const{id , first_name , last_name , email_addresses , image_url}=event.data
     
        const updateUserData = {
            email:email_addresses[0].email_address,
            full_name:first_name + "" + last_name,
            profile_picture:image_url
        }

        await User.findByIdAndUpdate(id , updateUserData)
        
    }
)


// Inngest function to delete the userdta in database
const SyncUserDeletion = inngest.createFunction(
    {id:'delete-user-from-clerk'},
    {event:'clerk/user.deleted'},
    async({event})=>{
        const{id}=event.data
     
        await User.findByIdAndDelete(id)
    }
)

// Inngest Function to send REminder when a new connection request is added

const sendNewConnectionRequestReminder = inngest.createFunction(
    {id:"send-new-connection-request-remainder"},
    {event:'app/connection-request'},
    async ({event , step})=>{
        const {connectionId} = event.data;

        await step.run('send-connection-request-mail' , async()=>{
            const connection = await Connection.findById(connectionId).populate('from_user_id to_user_id');
           
            const subject = 'New Connection Request';

            const body = `<div style = "font-family:Arial , sans-serif; padding:20px"> 
            <h2> Hi ${connection.to_user_id.full_name} , </h2>
            <p> You have new connection request from ${connection.from_user_id.full_name} -@${connection.from_user_id.username}  </p>
            <p> Click <a href = "${process.env.FRONTEND_URL}/connection" style = "color:#10b981"> here </a> to accept or reject the request</p>
            <br/> <p>Thanks  , <br/> Pingup-stay connected </p>
            </div>
             `

             await sendEmail({
                to:connection.to_user_id.email,
                subject,
                body
             })
        })

        const in24Hours = new Date(Date.now() + 24*60*60*100)
        await step.sleepUntil("wait-for-24-hours");
        await step.run('send-connection-request-remainder' , async()=>{
            const connection  = await Connection.findById(connectionId).populate('from_user_id  to_user_id');
            if(connection.status === 'accepted'){
                return {message:'Already accepted'}

            }

              const subject = 'New Connection Request';

            const body = `<div style = "font-family:Arial , sans-serif; padding:20px"> 
            <h2> Hi ${connection.to_user_id.full_name} , </h2>
            <p> You have new connection request from ${connection.from_user_id.full_name} -@${connection.from_user_id.username}  </p>
            <p> Click <a href = "${process.env.FRONTEND_URL}/connection" style = "color:#10b981"> here </a> to accept or reject the request</p>
            <br/> <p>Thanks  , <br/> Pingup-stay connected </p>
            </div>
             `

             await sendEmail({
                to:connection.to_user_id.email,
                subject,
                body
             })

             return {message:'Reminder sent'}

        })


    }
)

// Create an empty array where we'll export future Inngest functions
export const functions = [
    SyncUserCreation,
    SyncUserUpdation , 
    SyncUserDeletion,
    sendNewConnectionRequestReminder
];