
(function() {


    var MAXIMUM_PAGES = 5; // how many pages we will check
    var REPLIES_THRESHOLD = 3; // send mail if relies is less than...
    var GREETINGS_MSG = "";


    function dataParseForumListPage(host, body) {
        var $ = cheerio.load(body);
        var rows = $('.MessageList tbody tr');
        rows.each(
            function (index, row) {
                var cell = $(row).children();
                var replies = $(cell[2]).text().trim();
                if (replies < REPLIES_THRESHOLD) {
                    var postURL = "http://" + host + $($(cell[1]).find('a')[0]).attr('href');

                    request({
                        url: postURL,
                        method: 'GET'
                    }, function (err, res, body) {
                        if (err) {
                            console.log(postURL)
                            console.error('[ERROR]Collection' + err);
                            return;
                        }
                        dataParsePostPage(postURL, body);
                    });
                }

            }
        );

    }

    function dataParsePostPage(postURL, body) {
        var $ = cheerio.load(body);
        var replyBody = "";
        var topicDate = "";
        $('.lia-linear-display-message-view').each(
            function (index, item) {
                if (index == 0)// topic
                {
                    topicDate = $($(item).find('.local-date')[0]).text().trim() + $($(item).find('.local-friendly-date')[0]).text().trim();
                }
                else {
                    //replies
                    replyBody = replyBody + $(item).find('.UserName').html() + $(item).find('.lia-message-body').html();
                }
            }
        );

        sendNotifyMail(
            postURL,
            $($('.lia-thread-subject')[0]).text() + " @ " + topicDate,
            '<div style="color:purple;">' + $('#messagebodydisplay').html() + '</div>' +
            '<div style="color:green;">' + replyBody + "</div>");
    }

    function sendNotifyMail(url, title, body) {
        var mailOptions = {
            from: 'LR_Forum_Monitor ', // sender address
            to: mailTo, // list of receivers
            pool: true,
            subject: 'Forum Monitoring - ' + title, // Subject line
            html: GREETINGS_MSG + "<h2><a href='" + url + "'>" + title + "</a></h2>" + body // html body
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Message sent: ' + info.response);
            }
        });
    }

    var nodemailer = require('nodemailer'),  // for mail operation
        cheerio = require('cheerio'),   // parse HTML
        request = require('request'),   // fetch HTML
        readlineSync = require('readline-sync');    // get input parameter

// Wait for user's response.
    var mailboxFrom = readlineSync.question('MailBox Sent From (Gmail only):');
    console.log('Your mailbox is: ' + mailboxFrom + '');

// Handle the secret text (e.g. password).
    var password = readlineSync.question('Password for the mailbox: ', {
        hideEchoBack: true // The typed text on screen is hidden by `*` (default).
    });
    // set mail to self to avoid spamming issue
    var mailTo = mailboxFrom;
    console.log('The report will be sent to: ' + mailboxFrom + '');

    // mails option
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        pool: true,
        secureConnection: true, // use SSL
        port: 465, // port
        auth: {
            user: mailboxFrom,
            pass: password
        },
        proxy: 'http://web-proxy.sgp.hpecorp.net:8080'

    });

    (function () {
    // fetch sites (first page only)
        var forumURL = "http://community.hpe.com/t5/LoadRunner-Support-Forum/bd-p/sws-LoadRunner_SF";

        for (var i = 1; i <= MAXIMUM_PAGES; ++i) {
            request({
                url: forumURL + "/page/" + i,
                method: 'GET'
            }, function (err, res, body) {
                if (err) {
                    console.log(forumURL);
                    console.error('[ERROR]Collection' + err);
                    return;
                }
                dataParseForumListPage(this.uri.host, body);
            });
        }
    })();
})();
