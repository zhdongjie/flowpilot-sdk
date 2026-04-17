<template>
  <div class="bank-shell">
    <header class="bank-header">
      <div class="brand">
        <div class="brand-mark">FP</div>
        <div>
          <p class="brand-name">FlowPilot Bank</p>
          <p class="brand-tag">Customer Service System - Account Opening Demo</p>
        </div>
      </div>
      <div class="header-actions">
        <span class="status-pill">SYSTEM ONLINE</span>
        <button class="ghost" type="button" @click="resetDemo">Reset Demo</button>
      </div>
    </header>

    <div class="bank-body">
      <section class="bank-main">
        <div class="page-screen">
          <Transition name="page" mode="out-in">
            <section v-if="activePage === 'login'" key="login" class="page login-page">
              <div class="panel wide" data-guide-id="ui.form_login">
                <h2>Secure Login</h2>
                <p>Fill in credentials and submit to enter the customer center.</p>

                <form class="form-grid dense" @submit.prevent="handleLogin">
                  <label>
                    Phone
                    <input
                      v-model="loginPhone"
                      name="phone"
                      type="text"
                      placeholder="11-digit phone number"
                    />
                  </label>
                  <label>
                    Code
                    <input
                      v-model="loginCode"
                      name="code"
                      type="text"
                      placeholder="SMS verification code"
                    />
                  </label>

                  <div class="form-actions full">
                    <button
                      class="primary"
                      type="submit"
                      data-guide-id="ui.btn_login"
                      :disabled="loginLoading"
                    >
                      {{ loginLoading ? "Logging in..." : "Login" }}
                    </button>
                  </div>
                </form>

                <p v-if="loginMessage" class="inline-status">{{ loginMessage }}</p>
              </div>

              <div class="info-panel">
                <h3>Login Tips</h3>
                <ul>
                  <li>Use your registered phone number.</li>
                  <li>Verification code expires in 5 minutes.</li>
                  <li>If code is delayed, retry later.</li>
                </ul>
              </div>
            </section>

            <section v-else-if="activePage === 'menu'" key="menu" class="page menu-page">
              <div class="panel wide">
                <h2>Customer Service Center</h2>
                <p>Select a business entry to continue.</p>

                <div class="menu-grid">
                  <div
                    class="menu-item"
                    :class="{ active: activeMenu === 'overview' }"
                    role="button"
                    tabindex="0"
                    data-guide-id="ui.menu_overview"
                    @click="selectMenu('overview')"
                  >
                    <p>Account Overview</p>
                    <span>View account status</span>
                  </div>

                  <div
                    class="menu-item"
                    :class="{ active: activeMenu === 'open' }"
                    role="button"
                    tabindex="0"
                    data-guide-id="ui.menu_open_account"
                    @click="selectMenu('open')"
                  >
                    <p>Open Account</p>
                    <span>Create a new account</span>
                  </div>

                  <div
                    class="menu-item"
                    :class="{ active: activeMenu === 'profile' }"
                    role="button"
                    tabindex="0"
                    data-guide-id="ui.menu_profile"
                    @click="selectMenu('profile')"
                  >
                    <p>Profile</p>
                    <span>Update personal information</span>
                  </div>

                  <div
                    class="menu-item"
                    :class="{ active: activeMenu === 'funds' }"
                    role="button"
                    tabindex="0"
                    data-guide-id="ui.menu_funds"
                    @click="selectMenu('funds')"
                  >
                    <p>Funds</p>
                    <span>Transfer and recharge</span>
                  </div>
                </div>
              </div>

              <div class="info-panel">
                <h3>Business Tips</h3>
                <p>Choose Open Account to continue the guided flow.</p>
              </div>
            </section>

            <section v-else key="form" class="page form-page">
              <div class="panel wide" data-guide-id="ui.form_open_account">
                <h2>Account Opening Form</h2>
                <p>Complete fields and submit for review.</p>

                <form class="form-grid dense" @submit.prevent="handleSubmit">
                  <label>
                    Name
                    <input v-model="formName" name="name" type="text" placeholder="Customer name" />
                  </label>

                  <label>
                    ID Card
                    <input v-model="formIdCard" name="idCard" type="text" placeholder="ID number" />
                  </label>

                  <label>
                    Phone
                    <input v-model="formPhone" name="phone" type="text" placeholder="Contact phone" />
                  </label>

                  <label>
                    Risk Level
                    <select v-model="formRisk" name="riskLevel">
                      <option value="">Select risk level</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>

                  <label class="full">
                    Address
                    <input v-model="formAddress" name="address" type="text" placeholder="Account address" />
                  </label>

                  <label class="full">
                    Note
                    <textarea v-model="formNote" name="note" rows="3" placeholder="Additional note"></textarea>
                  </label>

                  <div class="form-actions full">
                    <button class="ghost" type="button" @click="goToMenu">Back</button>
                    <button
                      class="primary"
                      type="submit"
                      data-guide-id="ui.btn_submit_application"
                      :disabled="formLoading"
                    >
                      {{ formLoading ? "Submitting..." : "Submit Application" }}
                    </button>
                  </div>
                </form>

                <p v-if="formMessage" class="inline-status">{{ formMessage }}</p>
              </div>

              <div class="info-panel">
                <h3>Review Notes</h3>
                <p>Review is usually completed within one business day.</p>
              </div>
            </section>
          </Transition>
        </div>
      </section>

      <aside class="service-panel">
        <div class="service-head">
          <h3>Smart Customer Service</h3>
          <p>Service entrypoint in test project, not in SDK.</p>
        </div>

        <div class="service-actions">
          <button
            class="primary service-start"
            type="button"
            @click="startGuideFromService('manual trigger')"
          >
            Start Open Account Guide
          </button>
        </div>

        <div class="service-chat" data-guide-id="ui.service_chat_panel">
          <div class="service-messages">
            <p
              v-for="(message, index) in serviceMessages"
              :key="`${message.role}-${index}`"
              class="service-bubble"
              :class="message.role"
            >
              {{ message.text }}
            </p>
          </div>

          <form class="service-input-row" @submit.prevent="sendServiceMessage">
            <input
              v-model="serviceInput"
              type="text"
              placeholder="Try: I want to open an account"
            />
            <button class="primary" type="submit" :disabled="serviceLoading">
              {{ serviceLoading ? "Sending..." : "Send" }}
            </button>
          </form>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { login, submitOpenAccount } from "../api/bank";
import { sendChat } from "../api/chat";
import {
  resetFlowPilot,
  startFlowPilot,
  subscribeFlowPilot,
} from "../sdk-bridge";

const HOME_PATH = "/home";
const CUSTOMER_PATH = "/customer";
const CUSTOMER_CREATE_PATH = "/customer/create";
const STEP_NUMBER_BY_ID = {
  step_login_submit: 1,
  step_menu_open_account: 2,
  step_submit_application: 3,
};

const activePage = ref("login");
const activeMenu = ref("");
const loginPhone = ref("");
const loginCode = ref("");
const loginLoading = ref(false);
const loginMessage = ref("");

const formName = ref("");
const formIdCard = ref("");
const formPhone = ref("");
const formRisk = ref("");
const formAddress = ref("");
const formNote = ref("");
const formLoading = ref(false);
const formMessage = ref("");
const serviceInput = ref("");
const serviceLoading = ref(false);
const serviceCurrentStep = ref(null);
const guideStarted = ref(false);
const serviceMessages = ref([]);
let disposeFlowPilotSubscription = null;

const appendServiceMessage = (role, text) => {
  const cleanText = String(text || "").trim();
  if (!cleanText) {
    return;
  }
  serviceMessages.value.push({ role, text: cleanText });
};

const resetServiceState = () => {
  serviceInput.value = "";
  serviceLoading.value = false;
  serviceCurrentStep.value = null;
  guideStarted.value = false;
  serviceMessages.value = [];
  appendServiceMessage(
    "assistant",
    "Hello, I am the smart service in this test project. Ask for open account to start the guide."
  );
};

const handleFlowPilotStepChange = (step) => {
  const nextStepNumber = STEP_NUMBER_BY_ID[step?.id] || null;
  serviceCurrentStep.value = nextStepNumber;
  guideStarted.value = true;
};

const handleFlowPilotFinish = () => {
  serviceCurrentStep.value = null;
  guideStarted.value = false;
  appendServiceMessage("assistant", "Guide completed. The open-account flow is finished.");
};

const startGuideFromService = (source) => {
  const started = startFlowPilot("open_account");
  if (!started) {
    appendServiceMessage("assistant", "SDK is not loaded. Guide start failed.");
    return;
  }
  guideStarted.value = true;
  appendServiceMessage(
    "assistant",
    `Guide started by ${source}. Follow highlighted elements and tooltips.`
  );
};

const sendServiceMessage = async () => {
  const message = serviceInput.value.trim();
  if (!message || serviceLoading.value) {
    return;
  }

  serviceInput.value = "";
  appendServiceMessage("user", message);
  serviceLoading.value = true;

  try {
    const currentPage =
      typeof window === "undefined"
        ? HOME_PATH
        : window.location.pathname || HOME_PATH;
    const response = await sendChat(
      message,
      currentPage,
      typeof serviceCurrentStep.value === "number" ? serviceCurrentStep.value : undefined
    );

    if (response?.message) {
      appendServiceMessage("assistant", response.message);
    }
    if (response?.reason) {
      appendServiceMessage("assistant", `Reason: ${response.reason}`);
    }

    const step = response?.next_step || null;
    if (step && typeof step.step === "number") {
      serviceCurrentStep.value = step.step;
      if (!guideStarted.value) {
        startGuideFromService("smart service");
      }
      return;
    }

    serviceCurrentStep.value = null;
    guideStarted.value = false;
  } catch (error) {
    appendServiceMessage(
      "assistant",
      `Service request failed: ${error?.message || "unknown error"}`
    );
  } finally {
    serviceLoading.value = false;
  }
};

const syncRoute = (path, mode = "push") => {
  if (typeof window === "undefined") {
    return;
  }

  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current === path) {
    return;
  }

  if (mode === "replace") {
    window.history.replaceState({}, "", path);
    return;
  }

  window.history.pushState({}, "", path);
};

const goToLogin = (replace = false) => {
  activePage.value = "login";
  activeMenu.value = "";
  nextTick(() => {
    syncRoute(HOME_PATH, replace ? "replace" : "push");
  });
};

const goToMenu = (replace = false) => {
  activePage.value = "menu";
  activeMenu.value = "";
  nextTick(() => {
    syncRoute(CUSTOMER_PATH, replace ? "replace" : "push");
  });
};

const goToForm = (replace = false) => {
  activePage.value = "form";
  nextTick(() => {
    syncRoute(CUSTOMER_CREATE_PATH, replace ? "replace" : "push");
  });
};

onMounted(() => {
  disposeFlowPilotSubscription = subscribeFlowPilot({
    onStepChange: handleFlowPilotStepChange,
    onFinish: handleFlowPilotFinish,
  });
  goToLogin(true);
  resetServiceState();
});

onBeforeUnmount(() => {
  disposeFlowPilotSubscription?.();
  disposeFlowPilotSubscription = null;
});

const resetDemo = () => {
  loginPhone.value = "";
  loginCode.value = "";
  loginMessage.value = "";
  loginLoading.value = false;

  formName.value = "";
  formIdCard.value = "";
  formPhone.value = "";
  formRisk.value = "";
  formAddress.value = "";
  formNote.value = "";
  formMessage.value = "";
  formLoading.value = false;

  resetFlowPilot();
  resetServiceState();
  goToLogin(true);
};

const selectMenu = (key) => {
  activeMenu.value = key;
  if (key === "open") {
    goToForm();
  }
};

const handleLogin = async () => {
  if (loginLoading.value) {
    return;
  }

  loginMessage.value = "";
  const phone = loginPhone.value.trim();
  const code = loginCode.value.trim();

  if (!phone || !code) {
    loginMessage.value = "Please enter phone and code.";
    return;
  }

  loginLoading.value = true;
  try {
    const data = await login(phone, code);
    loginMessage.value = data.intro || "Login success.";
    goToMenu();
  } catch (err) {
    loginMessage.value = "Login failed, please retry.";
  } finally {
    loginLoading.value = false;
  }
};

const handleSubmit = async () => {
  if (formLoading.value) {
    return;
  }

  formMessage.value = "";
  if (!formName.value.trim() || !formIdCard.value.trim()) {
    formMessage.value = "Name and ID card are required.";
    return;
  }

  formLoading.value = true;
  try {
    const data = await submitOpenAccount({
      name: formName.value.trim(),
      id_card: formIdCard.value.trim(),
      phone: formPhone.value.trim(),
      risk_level: formRisk.value || "not-selected",
      address: formAddress.value.trim(),
      note: formNote.value.trim(),
    });

    formMessage.value = data.intro || "Application submitted.";
  } catch (err) {
    formMessage.value = "Submit failed, please retry.";
  } finally {
    formLoading.value = false;
  }
};
</script>


