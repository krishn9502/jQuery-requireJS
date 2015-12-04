define(["templates/mobileMainNavigation.tpl"], function(mobileNavTpl) {
    var testMainNav = {
        init: function() {
            testMainNav.initVariables();
            testMainNav.initEvents();
            testMainNav.initAjax();
            testMainNav.modifyMegaMenu();
            if (!testMainNav.isTouchDevice()) {
                $("html").addClass("no-touch");
            }
        },
        initVariables: function() {
            testMainNav.mobNavId = $("#className");
            testMainNav.desktopNav = $(".class-name");
            testMainNav.mobileNav = $(".mobile-class-name");
            testMainNav.countryBar = $(".promo-class-name");
        },
        initAjax: function() {},
        initEvents: function() {},
        modifyMegaMenu: function() {
            testMainNav.modifyMarketingContent();
            testMainNav.createMobileNavJson();
        },
        isTouchDevice: function() {
            var el = document.createElement("div");
            el.setAttribute("ongesturestart", "return;");
            return typeof el.ongesturestart === "function";
        },
        refactorMegaMenuLinks: function(sublist) {
            sublist.find(".nav-column").each(function(index) {/*...*/});
        },
        resetMegaMenuHeight: function(columns) {
            columns.height(Math.max.apply(Math, columns.map(function() {
                return $(this).height();
            })));
        },
        insertMenuDivider: function() {
            $("ul.mega-menu").find("li.menu-title").each(function() {/*...*/});
            window.setTimeout(function() {
                testMainNav.desktopNav.find(".nav-column").each(function() {/*...*/});
            }, 0);
        },
        removeExtraMenuLinks: function() {
            testMainNav.desktopNav.find("li[data-menu-order]").filter(function() {
                return +$(this).data("menuOrder") > 3;
            }).remove();
            testMainNav.desktopNav.find(".mega-menu:not(:has(li))").remove();
        },
        
        managePromoContent: function(total, sublist) {
            var listTag = '<ul class="mega-menu"></ul>';
            total.each(function(index, item) {/*...*/});
        },
        modifyMarketingContent: function() {
            testMainNav.desktopNav.find(".dropdown-megamenu").each(function() {/*...*/});
            testMainNav.insertMenuDivider();
            testMainNav.removeExtraMenuLinks();
        },
        createMobileNavJson: function() {
            var n0NodeList = [],
                n2NodeList = [],
                n3NodeList = [],
                getFisrtWord = function(string) {
                    return (string || "").replace(/([~!@#$%^&*()_+=`{}\[\]\|\\:;'<>,.\/? ])+/g, "-").replace(/^(-)+|(-)+$/g, "").toLowerCase();
                };
            testMainNav.desktopNav.find(".dropdown-megamenu").each(function() {
                var sublist = $(".sublist", this),
                    n0Node = $("> a", this),
                    n0Text = n0Node.text().trim(),
                    n0DataTarget = "menu-" + getFisrtWord(n0Text);
                n0NodeList.push({
                    text: n0Text,
                    dataTarget: n0DataTarget,
                    link: sublist.find("li.menu-title").length ? "javascript:void(0);" : n0Node.attr("href")
                });
                (function() {
                    var tempN2Store = [];
                    sublist.find("li.menu-title").each(function() {
                        var titleText = $(this).text().trim(),
                            titleTextSpace = n0DataTarget + "-" + getFisrtWord(titleText);
                        tempN2Store.push({
                            text: titleText,
                            dataTarget: titleTextSpace,
                            link: "javascript:void(0);",
                            parentName: n0Text,
                            parentDataTarget: n0DataTarget
                        });
                    });
                    n2NodeList.push(tempN2Store);
                    (function() {
                        var parentName, n3Target;
                        sublist.find(".nav-column").each(function(colInd) {
                            $(this).find('li[data-menu-order="' + colInd + '"]').each(function() {
                                var n3Node = $(this),
                                    n3Text = n3Node.text().trim(),
                                    n2Target = n0DataTarget + "-" + getFisrtWord(n3Text);
                                if (n3Node.hasClass("menu-title")) {
                                    parentName = n3Text;
                                    n3Target = n2Target;
                                    n3NodeList.push([]);
                                } else {
                                    n3NodeList[n3NodeList.length - 1].push({
                                        text: n3Text,
                                        link: n3Node.find("a").attr("href"),
                                        superParentName: n0Text,
                                        superParentDataTarget: n0DataTarget,
                                        parentName: parentName,
                                        dataTarget: n3Target
                                    });
                                }
                            });
                        });
                    })();
                })();
            });
            
            testMainNav.mobNavId.prepend(mobileNavTpl({
                alln0Nodes: n0NodeList,
                alln2Nodes: n2NodeList,
                alln3Nodes: n3NodeList
            }));
        }
    };
    return testMainNav.init;
});