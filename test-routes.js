let express = require("express");
const multer = require("multer");

const router = express.Router();
const AuthorizeMiddleware = require("../middleware/authorize");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads");
    },
    filename: function (req, file, cb) {
        const split_mime = file.mimetype.split("/");
        const extension = typeof split_mime[1] !== "undefined" ? split_mime[1] : "jpeg";
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({
    storage: storage,
});

/*** Cron Controllers ***/
require("./Controllers/CronController");

/*** Application Controllers ***/
const AuthController = require("./Controllers/AuthController");
const DashboardController = require("./Controllers/DashboardController");
const AccountSettingsController = require("./Controllers/AccountSettingsController");
const BillingController = require("./Controllers/BillingController");
const CustomizeCheckoutController = require("./Controllers/CustomizeCheckoutController");
const ShippingRateController = require("./Controllers/ShippingRateController");
const PaymentMethodsController = require("./Controllers/PaymentMethodsController");
const TranslationController = require("./Controllers/TranslationController");
const TaxesController = require("./Controllers/TaxesController");
const BuyLinkController = require("./Controllers/BuyLinkController");
const UpsellController = require("./Controllers/UpsellController");
const StripeWebhook = require("./Controllers/StripeWebhook");
const InvoicesController = require("./Controllers/InvoicesController");
const AutomaticDiscountController = require("./Controllers/AutomaticDiscountController");
const CartRecoveryEmails = require("./Controllers/CartRecoveryEmails");

const TestController = require("./Controllers/TestController");

/*** Admin  Controllers ***/
const AdminSubscriptionController = require("./Controllers/Admin/AdminSubscriptionController");

/*** Shopify Controllers ***/
const CheckoutController = require("./Controllers/CheckoutController");
const ShopifyStoreController = require("./Controllers/Shopify/ShopifyStoreController");
const ShopifyStripeController = require("./Controllers/Shopify/ShopifyStripeController");
const ShopifyPaypalController = require("./Controllers/Shopify/ShopifyPaypalController");

/************************** Order Controller **************************/
const OrderController = require("./Controllers/OrdersController");

/************************** Auth Routers **************************/
router.get("/", AuthorizeMiddleware.frontend_authorize, AuthController.login);
router.get("/login", AuthorizeMiddleware.frontend_authorize, AuthController.login);
router.post("/login", upload.none(), AuthController.login);

router.get("/register", AuthorizeMiddleware.frontend_authorize, AuthController.Register);
router.post("/register", upload.none(), AuthController.Register);

router.get("/account-verify/:user_id", AuthorizeMiddleware.frontend_authorize, AuthController.AccountVerification);
router.get("/verify-account/:user_id", AuthorizeMiddleware.frontend_authorize, AuthController.AccountVerificationSuccess);
router.post("/account-verify", upload.none(), AuthorizeMiddleware.frontend_authorize, AuthController.AccountVerification);

router.get("/logout", AuthController.logout);

router.get("/forgotPassword", AuthorizeMiddleware.frontend_authorize, AuthController.ForgotPassword);
router.post("/forgotPassword", upload.none(), AuthController.ForgotPassword);
router.get("/forgot-password/:id", AuthorizeMiddleware.frontend_authorize, AuthController.ForgotPasswordMessage);
router.post("/resend-link", upload.none(), AuthorizeMiddleware.frontend_authorize, AuthController.ForgotPasswordMessage);

router.get("/resetPassword/:user_id", AuthorizeMiddleware.frontend_authorize, AuthController.ResetPassword);
router.post("/resetPassword/:user_id", upload.none(), AuthController.ResetPassword);

// Account Setup Routers
router.get("/accountSettings", AuthorizeMiddleware.wed_authorize, AccountSettingsController.AccountSettings);
router.get("/accountSetting/:store_id", AuthorizeMiddleware.wed_authorize, AccountSettingsController.AccountSettingsStore);
router.post("/accountSettings", upload.none(), AuthorizeMiddleware.wed_authorize, AccountSettingsController.AccountSettings);
router.post("/change-avatar", upload.single("file"), AuthorizeMiddleware.wed_authorize, AccountSettingsController.ChangeAvatar);
router.delete("/delete-avatar", upload.none(), AuthorizeMiddleware.wed_authorize, AccountSettingsController.DeleteAvatar);
router.post("/changePassword", upload.none(), AuthorizeMiddleware.wed_authorize, AccountSettingsController.ChangePassword);

// Store Routers
router.get("/store-connect", upload.none(), AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, ShopifyStoreController.StoreConnect);
router.post("/store-connect", upload.none(), AuthorizeMiddleware.wed_authorize, ShopifyStoreController.StoreConnect);

router.get("/create-new-store/:store_id", AuthorizeMiddleware.wed_authorize, ShopifyStoreController.CreateNewStore);
router.post("/change-default-store", AuthorizeMiddleware.wed_authorize, ShopifyStoreController.ChangeDefaultStore);
router.get("/:store_id/manage-store", AuthorizeMiddleware.wed_authorize, ShopifyStoreController.manage_store);

// Dashboard Routers
router.get("/:store_id/dashboard", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, DashboardController.dashboard);

// Get States via Routers
router.post("/select-state", upload.none(), CheckoutController.getStatesByCountryCode);

//Customize Checkout Routers
router.get("/:store_id/customize-checkout", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, CustomizeCheckoutController.customize_checkout);
router.post("/customize-checkout", upload.none(), AuthorizeMiddleware.wed_authorize, CustomizeCheckoutController.customize_checkout);
router.get("/:store_id/preview-checkout", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, CustomizeCheckoutController.preview_checkout);
router.get("/:store_id/preview-thankyou", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, CustomizeCheckoutController.preview_thankyou);
router.post("/checkout-delete-section", upload.none(), AuthorizeMiddleware.wed_authorize, CustomizeCheckoutController.delete_section);
router.get("/:store_id/get-shop-token", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, CustomizeCheckoutController.get_shopToken);

//Shipping Rate Routers
router.get("/:store_id/shipping-rates", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, ShippingRateController.shipping_rates);
router.get("/:store_id/add-shipping-rate", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, ShippingRateController.add_shipping_rate);
router.post("/add-shipping-rate", upload.none(), AuthorizeMiddleware.wed_authorize, ShippingRateController.add_shipping_rate);

router.get("/:store_id/edit-shipping-rate/:id", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, ShippingRateController.edit_shipping_rate);
router.post("/edit-shipping-rate/", upload.none(), AuthorizeMiddleware.wed_authorize, ShippingRateController.edit_shipping_rate);

router.delete("/delete-shipping-rate", upload.none(), AuthorizeMiddleware.wed_authorize, ShippingRateController.delete_shipping_rate);

//Payment Method Routers
router.get("/:store_id/payment-methods", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, PaymentMethodsController.payment_methods);
router.get("/:store_id/add-payment-method", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, PaymentMethodsController.add_payment_method);
router.post("/add-payment-method", upload.none(), AuthorizeMiddleware.wed_authorize, PaymentMethodsController.add_payment_method);
router.get("/:store_id/payment-method/:id", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, PaymentMethodsController.edit_payment_method);
router.post("/delete-payment-method/", upload.none(), AuthorizeMiddleware.wed_authorize, PaymentMethodsController.delete_payment_method);
router.post("/edit-payment-method/:id", upload.none(), AuthorizeMiddleware.wed_authorize, PaymentMethodsController.edit_payment_method);

router.get("/paypal-webhook", upload.none(), AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, PaymentMethodsController.paypal_webhook);

// Translations Routers
router.get("/:store_id/translations", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, TranslationController.Translation);
router.post("/change-language", upload.none(), TranslationController.change_language);
router.post("/translations", upload.none(), AuthorizeMiddleware.wed_authorize, TranslationController.Translation);
router.post("/delete-translation", upload.none(), AuthorizeMiddleware.wed_authorize, TranslationController.delete_translation);

// Automatic Discounts Routers
router.get("/:store_id/discounts", AuthorizeMiddleware.wed_authorize, AutomaticDiscountController.discount_listing);
router.get("/:store_id/add-discount", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, AutomaticDiscountController.add_discount);
router.get("/:store_id/edit-discount", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, AutomaticDiscountController.edit_discount);
router.post("/delete-discount", upload.none(), AuthorizeMiddleware.wed_authorize, AutomaticDiscountController.delete_discount);
router.post("/add-discount", upload.none(), AuthorizeMiddleware.wed_authorize, AutomaticDiscountController.add_discount);
router.post("/edit-discount", upload.none(), AuthorizeMiddleware.wed_authorize, AutomaticDiscountController.edit_discount);
router.get("/:store_id/product-variant/:product_id",AuthorizeMiddleware.wed_authorize, AutomaticDiscountController.product_variants);

// Taxs Routers
router.get("/:store_id/taxes", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, TaxesController.taxes_index);
router.get("/:store_id/taxes/new", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, TaxesController.add_taxes);
router.post("/taxes/new", upload.none(), AuthorizeMiddleware.wed_authorize, TaxesController.add_taxes);
router.get("/:store_id/taxes/edit-tax-rate/:id", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, TaxesController.edit_tax_rate);
router.post("/taxes/edit-tax-rate", upload.none(), AuthorizeMiddleware.wed_authorize, TaxesController.edit_tax_rate);
router.post("/taxes/tax-preference", upload.none(), AuthorizeMiddleware.wed_authorize, TaxesController.tax_preference);
router.delete("/taxes/delete-tax-rate", upload.none(), AuthorizeMiddleware.wed_authorize, TaxesController.delete_tax);

// Billing Routers
router.get("/:store_id/billing-details", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, BillingController.billing_details);
router.post("/billing-detail", upload.none(), AuthorizeMiddleware.wed_authorize, BillingController.billing_details);
router.get("/:store_id/invoice-details", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, InvoicesController.invoice_listing);
router.get("/:store_id/invoice-details/:invoice_id/", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, InvoicesController.invoice_details);

// Disconnect Store Routers
router.get("/:store_id/store_disconnect", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, ShopifyStoreController.UnPublishStore);

// Buy Link Routers
router.get("/:store_id/buy-link", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, BuyLinkController.buy_link);
router.post("/buy-link", AuthorizeMiddleware.wed_authorize, BuyLinkController.buy_link);

router.get("/:store_id/upsell", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, UpsellController.upsell);
router.get("/:store_id/add-upsell", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, UpsellController.add_upsell);

// Cart Recovery
router.get("/:store_id/cart-recovery", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, CartRecoveryEmails.cart_recovery);

router.get("/:store_id/add-cart-recovery", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, CartRecoveryEmails.add_cart_recovery);
router.post("/add-cart-recovery", upload.none(), AuthorizeMiddleware.wed_authorize, CartRecoveryEmails.add_cart_recovery);

router.get("/:store_id/edit-cart-recovery/:id", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, CartRecoveryEmails.edit_cart_recovery);
router.post("/edit-cart-recovery", upload.none(), AuthorizeMiddleware.wed_authorize, CartRecoveryEmails.edit_cart_recovery);
router.get("/:store_id/preview-cart-recovery/:id", AuthorizeMiddleware.wed_authorize, AuthorizeMiddleware.checksubscription, CartRecoveryEmails.preview_cart_recovery);
router.delete("/delete-cart-recovery", upload.none(), AuthorizeMiddleware.wed_authorize, CartRecoveryEmails.delete_cart_recovery);

/*** Stripe Webhook ***/
router.post("/stripe-webhook", upload.none(), StripeWebhook.StripeWebhook);

/*** Test Routers ***/
router.get("/test", TestController.test);
router.get("/testmail", TestController.TestEmail);
router.get("/test-subscription", TestController.test_subscription);

router.get("/test-paypal", TestController.test_paypal);
router.get("/test-paypal-webhook", TestController.test_paypal_webhook);
router.get("/test-paypal-payment", TestController.test_paypal_payment);
router.get("/test-paypal-success", TestController.test_paypal_success);
router.get("/test-paypal-cancel", TestController.test_paypal_cancel);

/************************** Admin Router **************************/
router.get("/get-products", upload.none(), AdminSubscriptionController.get_product);
router.post("/create-product", upload.none(), AdminSubscriptionController.create_product);
router.get("/get-subscription-packages", upload.none(), AdminSubscriptionController.get_subscription_packages);
router.post("/create-subscription-package", upload.none(), AdminSubscriptionController.create_subscription_packages);

/************************** Single Route For Multiple Payment Method **************************/
router.get("/Products", ShopifyStoreController.Test);
router.post("/pay", upload.none(), ShopifyStoreController.PaymentGateways);

/************************** checkout save *************************/
router.post("/create-checkout/:store_id", CheckoutController.create_checkout);
router.get("/get-checkout/:checkout_id/:store_id", CheckoutController.get_checkout);
router.put("/put-checkout/:checkout_id/:store_id", CheckoutController.update_checkout);

/************************** checkout save *************************/
router.post("/c/:store_id/:checkout_id", CheckoutController.update_cart);

router.post("/order-create", upload.none(), OrderController.order_create);
router.get("/:store_id/checkout/:checkout_id", CheckoutController.shopify_checkout);
router.get("/:store_id/checkout-thankyou/:order_id", CheckoutController.shopify_thankyou);
router.get("/:store_id/check-out/:checkout_id", CheckoutController.email_checkout);

/*** Stripe api ***/
router.post("/ConnectCreate", ShopifyStripeController.ConnectCreate);
router.post("/MakePayment", ShopifyStripeController.MakePayment);

/*** Paypal api ***/
router.get("/paypal-success/:checkout_id/:shop_id", ShopifyPaypalController.getSuccessPaypal);
router.get("/paypal-cancel", ShopifyPaypalController.cancelPaypal);

router.get("/checkoutDomain", CheckoutController.checkoutDomain);
router.get("/checkout-redirect", CheckoutController.checkout_redirect);



module.exports = router;
