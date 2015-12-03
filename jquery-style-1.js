define(["jquery", "parsley", "ajaxFactory", "handlebars", "googleAddressApi", "templates/checkoutPaymentSelectedBillingAddress.tpl", "checkoutServerSideValidaton", "templates/checkoutState.tpl", "checkoutUI", "checkoutPaymentPlugin"], function($, parsley, ajaxFactory, handlebars, googleAddressApi, checkoutPaymentSelectedBillingAddress, checkoutServerSideValidaton, checkoutPaymentState, checkoutUI) {
    var duplicateCheck = false;
    function knowUser(cards) {
        require(["templates/checkoutPaymentKnown.tpl"], function(checkoutPaymentKnown) {
            $('[data-tabpanel="credit-card"]').html(checkoutPaymentKnown({
                cards: cards,
                isRemoveable: cards.length > 19
            })).promise().done(function() {
                checkoutUI.domManipulation();
            });
        });
    }

    function knowUserNew() {
        require(["templates/checkoutPaymentKnownNew.tpl"], function(checkoutPaymentKnownNew) {
            $('[data-tabpanel="credit-card"]').html(checkoutPaymentKnownNew({})).promise().done(function() {
                checkoutUI.domManipulation();
            });
        });
    }

    function guestUser() {
        require(["templates/checkoutPaymentGuest.tpl"], function(checkoutPaymentGuestTpl) {
            $('[data-tabpanel="credit-card"]').html(checkoutPaymentGuestTpl({})).promise().done(function() {
                checkoutUI.domManipulation();
            });
        });
    }

    function editSelectedCardDetails(subscriptionid, creditCards) {
        return creditCards.filter(function(elem) {
            return +elem.subscriptionId === +subscriptionid;
        })[0];
    }

    function makePrimaryCardRequest() {}

    function cardCVVNumberUpdate() {}

    function populatepaymentgetway() {}

    function convertFormToJSON(form) {
        var array = jQuery(form).serializeArray();
        var json = {};
        jQuery.each(array, function() {
            json[this.name] = this.value || "";
        });
        return json;
    }

    function validateCardFields() {
        var guestCreditCard = $("#guestCreditCard"),
            billingNewAddressForm = $("#billingNewAddressForm"),
            paymentForm = $("#paymentForm");
        if (guestCreditCard.length) {
            guestCreditCard.parsley().validate();
        }
        if (billingNewAddressForm.length) {
            billingNewAddressForm.parsley().validate();
        }
        if (paymentForm.length) {
            paymentForm.parsley().validate();
        }
        if (guestCreditCard.length && $("#guestCreditCard").parsley().isValid() && paymentForm.length && $("#paymentForm").parsley().isValid()) {
            if (!$("#billing-toggle2").is(":checked")) {
                return $("#billingNewAddressForm").parsley().isValid();
            } else {
                return true;
            }
        }
        return false;
    }

    function validateAndAddCard() {
        $("#payment_form,#paymentgetway").find('input[name="currency"]').val($('[data-cc-for="currency"]').val());
        if (!$("#billing-toggle2").is(":checked")) {
            insertLatestCardDetailsValues();
        }
        if (validateCardFields()) {
            $("#submitCCDetails").trigger("click");
        }
    }

    function validateSavedCards() {
        $("#savedCardsForms").parsley("validate");
        $("#savedCardsForms").parsley().validate();
        return $("#savedCardsForms").parsley().isValid();
    }

    function validateAndMoveToReview() {
        if (validateSavedCards()) {
            var visibleElem = $("#savedCardsForms").find("input:visible"),
                subscriptionid = {
                    subscriptionid: visibleElem.parents("[data-subscriptionid]").data("subscriptionid")
                };
            checkoutUI.storage().set(visibleElem.val());
            var options = {
                type: "POST",
                crossDomain: true,
                url: "/domainname/en/checkout/generateSign.json",
                data: subscriptionid,
                dataType: "json"
            };
            var callback = {
                done: function() {
                    window.location.href = "#review";
                }
            };
            ajaxFactory.httpRequest(options, callback);
        }
    }

    function cardNumberType(value) {
        var card = checkoutUI.getCreditCardType(value);
        $('input[name="card_type"]').val(cybersourceCardTypeCodes[card]);
        $('input[data-cc-for="card_cvv_number"]').attr("maxlength", cvvNumberlength[card]);
        $('input[data-cc-for="card_number"]').attr("data-parsley-minlength", cybersourceCardNumLength[card]);
    }

    function cardDetailsUpdation(checked) {
        var form = $("#payment_form");
        $.each(form.data("json"), function(key, value) {
            var val = "";
            if (key !== "CSRFToken") {
                if (checked) {
                    val = value;
                }
                $('[name="' + key + '"]', form).val(val);
            }
        });
    }

    function cybersourceCardValidation(form) {
        var action = form.action,
            contentType = "application/x-www-form-urlencoded; charset=utf-8",
            jsonFormData = convertFormToJSON(form);
        if (window.XDomainRequest) {
            contentType = "text/plain";
        }
        var options = {
            url: action,
            type: "POST",
            dataType: "json",
            data: jsonFormData,
            crossDomain: true
        };
        var callback = {
            done: function(data) {
                if (data.reasonCode === 100 && data.message === "payment.successful") {
                    if (data.reviewRedirect) {
                        window.location.href = "#review";
                    } else {
                        window.location.href = "#payment";
                    }
                }
            }
        };
        ajaxFactory.httpRequest(options, callback);
    }

    function insertLatestValues() {
        var elem = $(this),
            value = elem.val(),
            dataccfor = elem.attr("data-cc-for");
        switch (dataccfor) {
            case "bill_to_phone":
                value = value.replace(/\D/g, "");
                break;
            case "card_number":
                value = value.replace(/\D/g, "");
                cardNumberType(value);
                break;
            case "card_expiry_date":
                value = value.replace("/", "-").replace(/\s/g, "");
                break;
            default:
                ;
        }
        $("#payment_form,#paymentgetway").find('input[name="' + dataccfor + '"]').val(value);
    }

    function insertLatestCardDetailsValues() {
        $("[data-cc-for]").each(insertLatestValues);
    }

    function ccRemoveSavedcardDone(data) {
        if (data.message === "success") {
            if (data.SavedCards.length) {
                knowUser(data.SavedCards);
            } else {
                knowUserNew();
            }
            checkoutPaymentDetail.parsley();
        }
    }

    function ccRemoveSavedcardFail() {}

    function ccRemoveSavedcard() {
        var vm = $(this).parents("[data-subscriptionid]"),
            jsonFormData = {
                "paymentInfoId": vm.data("id"),
                "subscriptionId": vm.data("subscriptionid"),
                "CSRFToken": $('[name="CSRFToken"]').val()
            },
            options = {
                type: "POST",
                url: "/domainname/en/checkout/removeCard",
                data: jsonFormData,
                dataType: "json"
            };
        ajaxFactory.httpRequest(options, {
            done: ccRemoveSavedcardDone,
            fail: ccRemoveSavedcardFail
        });
    }

    function addNewCardCyberSource() {
        $("#submitCCDetails").trigger("click");
    }
    checkoutPaymentDetail = {
        init: function(response, variables) {
            if (location.hash.substring(1).indexOf("payment") > -1) {
                this.response = response || {};
                this.variables = variables || {};
                this.includes();
                this.handlebars();
                this.creditCard();
                this.paypal();
                this.paypalCredit();
                if (!duplicateCheck) {
                    this.events();
                    duplicateCheck = true;
                }
                this.savedBillingAddress = response.addressType.shippingAddress;
                this.currentBillingAddress = {};
                this.changeBillingAddress();
                this.modaledit = false;
                this.parsley();
                this.modalKnownSaveBilling();
                selectedState = "";
            }
        },
        modalKnownSaveBilling: function() {
            $(document).on("click", "#modalKnownNewSaveBilling,#modalKnownEditSaveBilling", function() {
                $("#editCardBillingAddress").parsley("validate");
                $("#editCardBillingAddress").parsley().validate();
                checkoutUI.methods.ccValidate();
            });
        },
        parsley: function() {
            $("#guestCreditCard").parsley("validate");
            $("#billingNewAddressForm").parsley("validate");
            $("#paymentForm").parsley("validate");
        },
        changeBillingAddress: function() {
            $(document).on("click", ".billing-list .billing-dropdown li", function() {
                var billingListDropdown = $(".billing-list .billing-dropdown");
                billingListDropdown.find("li").removeClass("selected");
                $(this).addClass("selected");
                checkoutPaymentDetail.selectedShippingAddress($(this).find("a").attr("id"));
                checkoutPaymentDetail.currentBillingAddress = $(this).find("a").attr("id");
                billingListDropdown.find(".dropdown-toggle span").html($(this).find("a").html());
            });
        },
        selectedShippingAddress: function(addressId) {
            $(".modal .billing-info").html("");
            var selectedAddress = function() {
                for (var k in checkoutPaymentDetail.savedBillingAddress) {
                    if (checkoutPaymentDetail.savedBillingAddress[k].addressId === addressId) {
                        return checkoutPaymentDetail.savedBillingAddress[k];
                    }
                }
            }();
            $(".modal .billing-info").html(checkoutPaymentSelectedBillingAddress({
                addressDetails: selectedAddress
            }));
        },
        includes: function() {},
        getStateList: function() {
            var options = {
                "methodType": "GET",
                "methodData": "countryId=" + $("#country").val(),
                "url": $("#CheckoutMainDiv").data("states"),
                "parentElem": $("#CheckoutMainDiv")
            };
            ajaxFactory.ajaxFactoryInit(options, this.generateStateDropdown);
        },
        generateStateDropdown: function(data) {
            if (data.status === "success") {
                handlebars.registerHelper("ifEqual", function(obj, options) {
                    var state = "";
                    if (obj.id === checkoutPaymentDetail.selectedState) {
                        state = options.fn({
                            selected: "selected",
                            id: obj.id,
                            isAPO: obj.isApoState,
                            name: obj.name
                        });
                    } else {
                        state = options.fn({
                            selected: "",
                            id: obj.id,
                            isAPO: obj.isApoState,
                            name: obj.name
                        });
                    }
                    return state;
                });
                $("#state").html(checkoutPaymentState({
                    states: data.states
                }));
            }
        },
        events: function() {
            var creditCard, subscriptionid = function(elem) {
                return $(elem).parents("[data-subscriptionid]").data("subscriptionid");
            };
            
            if (this.response.payment) {
                creditCard = this.response.payment.creditCard;
            }
            $(document).on("click", ".card-container .edit", function() {
                editSelectedCardDetails(subscriptionid(this), creditCard.savedCard);
            });
            $(document).on("click", ".remove-selected-card", ccRemoveSavedcard);
          
            $(document).on("click", "a.make-primary", function() {
                $(".card-container").removeClass("primary-card");
                $(this).parents(".card-container").addClass("primary-card ");
                makePrimaryCardRequest(subscriptionid(this), creditCard);
            });
           
            $(document).on("keydown", ".cc-cvv-number", function() {
                cardCVVNumberUpdate(subscriptionid(this), $(this).val());
            });
			
            $(document).on("keydown", ".cc-cvv-number", function() {
                cardCVVNumberUpdate(subscriptionid(this), $(this).val());
            });
			
            $(document).on("click", '.checkOutNextPage[data-nextpage="#review"]', function() {
                if (!creditCard || creditCard && !creditCard.savedCard.length) {
                    validateAndAddCard();
                } else {
                    if (creditCard && creditCard.savedCard.length) {
                        validateAndMoveToReview();
                    }
                }
            });
			
            $(document).on("keyup change", '[data-cc-for="bill_to_forename"], [data-cc-for="bill_to_surname"]', function() {
                $('[name="nameOnCard"]').val($('[data-cc-for="bill_to_forename"]').val() + " " + $('[data-cc-for="bill_to_surname"]').val());
            });
			
            $(document).on("keyup change", "[data-cc-for]", insertLatestValues);
			
            $(document).on("submit", "#payment_form", function(event) {
                event.preventDefault();
                var form = this,
                    jsonFormData = convertFormToJSON(form),
                    contentType = "application/x-www-form-urlencoded; charset=utf-8";
                if (window.XDomainRequest) {
                    contentType = "text/plain";
                }
                var options = {
                    type: "POST",
                    crossDomain: true,
                    url: "/domainname/en/checkout/generateSign.json",
                    data: jsonFormData,
                    dataType: "json"
                };
                var callback = {
                    done: function(data, textStatus, jqXHR) {
                        var cyberParams = jqXHR.responseText;
                        populatepaymentgetway(cyberParams);
                        $("#paymentgetway").trigger("submit");
                    }
                };
                ajaxFactory.httpRequest(options, callback);
            });
            $(document).on("submit", "#paymentgetway", function(event) {
                event.preventDefault();
                var form = this,
                    jsonFormData = convertFormToJSON(form),
                    contentType = "application/x-www-form-urlencoded; charset=utf-8";
                if (window.XDomainRequest) {
                    contentType = "text/plain";
                }
                var options = {
                    type: "POST",
                    crossDomain: true,
                    url: "https://domainname.paymentsource.com/token/create/direct",
                    data: jsonFormData,
                    dataType: "json"
                };
                var callback = {
                    fail: function(jqXHR) {
                        document.getElementById("cyberSourceresponse").innerHTML = jqXHR.responseText;
                        var formTag = document.getElementById("custom_redirect");
                        var input = document.createElement("input");
                        input.type = "text";
                        input.name = "CSRFToken";
                        input.value = document.getElementsByName("CSRFToken")[0].value;
                        formTag.appendChild(input);
                        document.getElementById("custom_redirect").action = "/domainname/en/checkout/cyberSourcePayment";
                        cybersourceCardValidation(document.getElementById("custom_redirect"));
                    }
                };
                ajaxFactory.httpRequest(options, callback);
            });
        },
        handlebars: function() {
            handlebars.registerHelper("if_even", function(conditional, options) {
                if ((conditional + 1) % 2 === 0) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
            });
            handlebars.registerHelper("json", function(context) {
                return JSON.stringify(context);
            });
            handlebars.registerHelper("ifCountry", function(country1, country2, options) {
                if (country1 === country2) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
            });
            handlebars.registerHelper("ifState", function(editState, options) {
                if (editState) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
            });
        },
        creditCard: function() {
            this.variables.chkNextPage.find(".next-page").html("Review").end().attr("data-nextpage", this.variables.chkNextPage.attr("data-review"));
            if (this.response.registeredUser) {
                if (this.response.payment.creditCard.savedCard.length) {
                    knowUser(this.response.payment.creditCard.savedCard);
                } else {
                    knowUserNew();
                }
            } else {
                guestUser();
            }
        },
        handleNewCreditcard: function() {},
        handlePaypalCredit: function() {},
        paypal: function() {},
        paypalCredit: function() {}
    };
    return {
        paymentDetails: checkoutPaymentDetail
    };
});
