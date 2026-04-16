import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import { initFlowPilot } from "./sdk-bridge";
import { installMockApi } from "./api/mock-server";

installMockApi();
createApp(App).mount("#app");
initFlowPilot();
