(function($, scope) {
    /**
     * Account closure/deletion
     *
     * @param opts {Object}
     * @constructor
     */
    var AccountClosure = function(opts) {
        var self = this;

        var defaultOptions = {
            'prefix': 'cancel',
            'code': '',
            'email': '',
            'secret': Math.random(),
            'dialogClass': '.reset-success-st2',
            'dlgName': 'resetsuccessst2',
            'fbDlgName': 'resetsuccessst3',
            'passwordInputId': '#reset_success_st2_pass',
            'inputWrapperClass': '.fm-account-input',
            'tOut': 1000,
            'fbDlgClass': '.reset-success-st3',
            'feedbackText': '',
            'fbType': 'accClosureUserFeedback'
        };

        self.opt = $.extend(true, {}, defaultOptions, opts);
    };

    AccountClosure.prototype.initAccountClosure = function() {
        var self = this;

        $(self.opt.passwordInputId).val('');
        $('.fm-dialog').removeClass('error active');
        $('.fm-dialog-overlay').removeClass('hidden');
        $('body').addClass('overlayed');
        $('.fm-dialog' + self.opt.dialogClass).removeClass('hidden');

        $.dialog = self.opt.dlgName;

        $(self.opt.passwordInputId).focus(function() {
            $('.fm-dialog').addClass('active');
        });

        // Button cloase account listener
        $(self.opt.dialogClass + ' .fm-dialog-button.close-account').rebind('click', function(e) {

            loadingDialog.show();

            self.opt.code = page.replace(self.opt.prefix, '');
            postLogin(u_attr.email, $(self.opt.passwordInputId).val(), false, function(r) {

                loadingDialog.hide();

                // Password is matched
                if (r) {
                    self._handleFeedback(self._accountClosure, self);
                }

                // Password is wrong
                else {
                    $(self.opt.passwordInputId).val('');
                    $('.fm-dialog').addClass('error');
                    setTimeout(function() {
                        $('.fm-dialog').removeClass('error');
                    }, self.opt.tOut);
                    $(self.opt.passwordInputId).focus();
                }
            });
        });

        // Cancel button listener
        $(self.opt.dialogClass + ' .fm-dialog-button.cancel').rebind('click', function() {
            loadingDialog.hide();
            document.location.hash = 'fm/account';
        });

        // Keyboard button listener <Enter key>
        $(self.opt.passwordInputId).rebind('keypress', function(e) {

            var key = e.wich || e.keyCode;

            if (key === 13) {
                $(self.opt.dialogClass + ' .fm-dialog-button.close-account').click();
            }
        });
    };

    /**
     * _accountClosure, closes account
     * 
     * @param {string} url code
     * @param {string} email
     * @param {string} hash
     * 
     */
    AccountClosure.prototype._accountClosure = function(code, email, hash) {
        var self = this;

        api_resetuser({callback: function(code) {
            closeDialog();
            $('.reset-success-st2').removeClass('active');
            loadingDialog.hide();

            if (code === 0) {
                // Account successfully canceled/deleted
                msgDialog('warninga', 'Account cancellation', 'Your account is canceled successfully.', '', function() {
                    document.location.hash = 'login';
                });
            }
            else if (code === EEXPIRED || code === ENOENT) {
                msgDialog('warninga', 'Cancellation link has expired.', 'Cancellation link has expired, please try again.', '', function() {
                    document.location.hash = 'fm/account';
                });
            }
        }}, code, email, hash);
    };

    /**
     * _getEmail, query server for email using given url code
     * 
     * @param {callback} on success call this function
     * 
     */
    AccountClosure.prototype._getEmail = function(_handleFeedbackCallback, callback_obj) {
        var self = this;

        api_req({a: 'erv', c: self.opt.code}, {
            callback: function(res) {
                if (typeof res === 'number') {
                    if (res === EEXPIRED) {
                        loadingDialog.hide();
                        msgDialog('warninga', 'Cancellation link has expired.', 'Cancellation link has expired, please try again.', '', function() {
                            document.location.hash = 'fm/account';
                        });
                    }
                    else {
                        loadingDialog.hide();
                        msgDialog('warninga', 'Invalid cancelation link.', 'Invalid cancellation link, please try again.', '', function() {
                            document.location.hash = 'fm/account';
                        });
                    }
                }
                else {
                    if (res[0] === 21) {
                        self.opt.email = res[1];
                        if (_handleFeedbackCallback) {
                            _handleFeedbackCallback(callback_obj);
                        }
                    }
                }
            }
        });
    };

    AccountClosure.prototype._deleteLeftovers = function() {
//        mDBclear();
        for (var i in localStorage) {
            if (localStorage.hasOwnProperty(i)) {
//                delete localStorage[i];
            }
        }
//        delete localStorage;
        closeDialog();
        $('.reset-success-st3').removeClass('active');
        document.location.hash = 'login';
    };

    AccountClosure.prototype._gatherFeedback = function() {
        var text = '',
            btnId = $('.reset-success-st3 .radioOn').attr('id');

        // Other: Textarea, $('.feedback-textarea textarea').val()
        if (btnId === 'res1_div') {
            text = "I don’t use my account anymore";
        }
        else if (btnId === 'res2_div') {
            text = 'I have another MEGA account';
        }
        else if (btnId === 'res3_div') {
            text = 'I have experienced too many problems';
        }
        else if (btnId === 'res4_div') {
            text = "My favourite browser is not technologically compatible and I don't want to change";
        }
        else if (btnId === 'res5_div') {
            text = "I find the interface too confusing to use";
        }
        else if (btnId === 'res6_div') {
            text = "MEGA has under-delivered on its promise";
        }
        else {
            text = $('.feedback-textarea-bl textarea').val();
        }

        return text;
    };

    AccountClosure.prototype._prepareJsonString = function(text) {

        var result = '{"lang": "' + lang + '", "feedbackText": "' + text + '"}';

        return result;
    };

    AccountClosure.prototype._handleFeedback = function(_accountClosureCallback, obj) {
        
        // Reset feedback dialog to default state
        $(obj.opt.fbDlgClass + ' .radioOn').attr('class', 'radioOff');
        $(obj.opt.fbDlgClass + ' .radio-txt').removeClass('active');
        $(obj.opt.fbDlgClass + ' #res1_div')
            .attr('class', 'radioOn')
            .next().addClass('active');
        $(obj.opt.fbDlgClass + ' .feedback-textarea-bl textarea').val('');
        $('.fm-dialog' + obj.opt.fbDlgClass).removeClass('hidden');

        $.dialog = obj.opt.fbDlgName;

        // Send feedback button listener
        $(obj.opt.fbDlgClass + ' .fm-dialog-button.feedback-submit').rebind('click', function() {

            obj.opt.feedbackText = obj._prepareJsonString(obj._gatherFeedback());
            api_req({'a': 'clog', 't': obj.opt.fbType, 'd': obj.opt.feedbackText});

            if (_accountClosureCallback) {
                _accountClosureCallback(obj.opt.code, obj.opt.email, obj.opt.secret.toString());
            }
            
            obj._deleteLeftovers();
        });

        // Cancel button listener
        $(obj.opt.fbDlgClass + ' .fm-dialog-button.cancel').rebind('click', function() {

            obj.opt.feedbackText = obj._prepareJsonString("User did NOT provide feedback.");
            api_req({'a': 'clog', 't': obj.opt.fbType, 'd': obj.opt.feedbackText});
            
            if (_accountClosureCallback) {
                _accountClosureCallback(obj.opt.code, obj.opt.email, obj.opt.secret.toString());
            }
            
            obj._deleteLeftovers();
        });

        // On focus
        $(obj.opt.fbDlgClass).off('focus', '.feedback-textarea-bl');
        $(obj.opt.fbDlgClass).on('focus', '.feedback-textarea-bl', function() {
            $(obj.opt.fbDlgClass + ' .radio-txt').removeClass('active');
            $(obj.opt.fbDlgClass + ' .radioOn').attr('class', 'radioOff');
            $(obj.opt.fbDlgClass + ' #res7_div')
                .attr('class', 'radioOn')
                .next().addClass('active');
        });
        // Keyboard button listener <Enter key>
        $(obj.opt.fbDlgClass).rebind('keypress', function(e) {

            var key = e.wich || e.keyCode;

            if (key === 13) {
                $(obj.opt.fbDlgClass + ' .fm-dialog-button.feedback-button').click();
            }
        });

        $('.feedback-textarea-bl textarea').on('keyup', function() {
            obj._feedbackAreaResizing();
        });

        $('.reset-success-st3 input[type=radio]').rebind('change', function() {
            $('.reset-success-st3 .radioOn').removeClass('radioOn').addClass('radioOff');
            $('.reset-success-st3 .radio-txt').removeClass('active');
            $(this).removeClass('radioOff').addClass('radioOn').parent().removeClass('radioOff').addClass('radioOn').next().addClass('active');
        });

    };

    AccountClosure.prototype._feedbackAreaResizing = function() {
        var txt = $('.feedback-textarea-bl textarea'),
            txtHeight = txt.outerHeight(),
            hiddenDiv = $('.feedback-hidden'),
            pane = $('.feedback-textarea-scroll'),
            content = txt.val(),
            api;
        content = content.replace(/\n/g, '<br />');
        hiddenDiv.html(content + '<br/>');

        if (txtHeight !== hiddenDiv.outerHeight()) {
            txt.height(hiddenDiv.outerHeight());

            if ($('.feedback-textarea').outerHeight() >= 96) {
                pane.jScrollPane({enableKeyboardNavigation: false, showArrows: true, arrowSize: 5});
                api = pane.data('jsp');
                txt.blur();
                txt.focus();
                api.scrollByY(0);
            }
            else {
                api = pane.data('jsp');
                if (api) {
                    api.destroy();
                    txt.blur();
                    txt.focus();
                }
            }
        }
    };

    //export
    scope.mega = scope.mega || {};
    scope.mega.AccountClosure = AccountClosure;
}(jQuery, window));
