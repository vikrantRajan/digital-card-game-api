module.exports = {
  // All secret values must be stored in .env. No endpoint or secret values must be exposed to public.
  version: "0.01",
  environment: "dev",

  port: 3600,
  port_https: 3601,
  api_title: "Digital Card",
  api_url: "xxxxxxxxx",

  //HTTPS config
  https_key: "",
  https_ca: "",
  https_cert: "",
  allow_http: true,
  allow_https: false,

  //JS Web Token Config
  jwt_secret: "xxxxxxxxx",
  jwt_expiration_in_seconds: 360000, //100 hours
  jwt_refresh_expiration_in_seconds: 720000, //200 hours

  //Security config
  private_secret: "xxxxxxxxx",
  public_secret: "xxxxxxxxx",
  
  //User Permissions Config
  permissionLevels: {
    USER: 1,
    MANAGER: 4,
    ADMIN: 7,
  },

  mongodb_connect: "xxxxxxxxx",

  mongodb_options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  },

  //Storage settings, im fine with this in the config file, no one has access to the repo, ill revoke this key later and change it on the live version
  storage_bucket: "xxxxxxxxx",
  storage_endpoint: "xxxxxxxxx",
  storage_access_key: "xxxxxxxxx",
  storage_secret_key: "xxxxxxxxx",

  //IAP settings
  iap_apple_secret: "",
  iap_google_key_sandbox: "",
  iap_google_key: "",
  iap_debug: true,
  iap_sandbox: true,

  //Email config
  smtp_name: "Digital Cards",
  smtp_email: "digitalcards@test.com",
  smtp_server: "test.com",
  smtp_port: "465",
  smtp_user: "digitalcards@test.com",
  smtp_password: "test",

  //Card probabilities, 0=common, 1=uncommon, 2=rare, 3=very_rare, 4=ultra_rare
  probabilities: [
    {0: 0.5,  1: 0.5}, //Slot 1
    {0: 0.5,  1: 0.5}, //Slot 2
    {0: 0.5,  1: 0.25, 2: 0.15, 3: 0.1}, //Slot 3
    {0: 0.5,  1: 0.25, 2: 0.15, 3: 0.1}, //Slot 4
    {2: 0.7, 3: 0.2, 4: 0.1} //Slot 5
    ],

  variant_probability: 0.15,
};
