import layout from "./layout";
import todo from "../pages/app/todo/store";
import email from "../pages/app/email/store";
// import chat from "../pages/app/chat/store";
import project from "../pages/app/projects/store";
import kanban from "../pages/app/kanban/store";
import calendar from "../pages/app/calender/store";
import auth from "./redux/auth";
import notificationReducer from "./redux/notificationSlice";
import chatReducer from "./redux/chatSlice";

const rootReducer = {
  layout,
  todo,
  email,
  // chat,
  project,
  kanban,
  calendar,

  //Main
  auth,
  notification: notificationReducer,
  chat: chatReducer,
};
export default rootReducer;
