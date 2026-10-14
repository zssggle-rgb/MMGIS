import { uiLabel, uiMarkup, uiRenderedMarkup } from '../../../../src/i18n/legacy-ui'
import $ from 'jquery'

import calls from '@pre/calls'
import useUIStore from '@basics/UserInterface_/store/uiStore'

var DrawTool = null
var previousToolPanelWidth = null
var Publish = {
    init: function (tool) {
        DrawTool = tool
        DrawTool.showReview = Publish.showReview
        DrawTool.cleanupReview = Publish.cleanupReview
    },
    cleanupReview: function () {
        $('#drawToolReview').remove()
        DrawTool.isReviewOpen = false
        if (previousToolPanelWidth != null) {
            useUIStore
                .getState()
                .setToolPanelWidth(previousToolPanelWidth)
            $('#toolPanel').css('width', previousToolPanelWidth + 'px')
            $('#toolPanelDrag').css(
                'left',
                parseInt($('#toolPanel').css('left')) +
                    previousToolPanelWidth +
                    'px'
            )
            previousToolPanelWidth = null
        }
    },
    showReview: function (switchContent) {
        DrawTool.isReviewOpen = true
        $('#drawToolReview').remove()

        var currentWidth = useUIStore.getState().toolPanelWidth
        if (previousToolPanelWidth == null) {
            previousToolPanelWidth = currentWidth
        }
        if (currentWidth < 390) {
            useUIStore.getState().setToolPanelWidth(390)
            $('#toolPanel').css('width', '390px')
            $('#toolPanelDrag').css(
                'left',
                parseInt($('#toolPanel').css('left')) + 390 + 'px'
            )
        }

        if (switchContent !== false && DrawTool.activeContent != 'shapes')
            DrawTool.showContent('shapes')

        //Turn on all master files
        // and turn off all non master files
        for (var f in DrawTool.files) {
            var id = DrawTool.files[f].id
            if (
                DrawTool.files[f].is_master &&
                DrawTool.filesOn.indexOf(id) == -1
            ) {
                DrawTool.toggleFile(id, null, true)
                $('.drawToolFileCheckbox[file_id="' + id + '" ]').addClass('on')
            } else if (
                !DrawTool.files[f].is_master &&
                DrawTool.filesOn.indexOf(id) != -1
            ) {
                DrawTool.toggleFile(id, null, true)
                $('.drawToolFileCheckbox[file_id="' + id + '" ]').removeClass(
                    'on'
                )
            }
        }

        //Hide all non master files
        // prettier-ignore
        var markup = [
                "<div id='drawToolReview'>",
                    "<div id='drawToolReviewTopbar'>",
                        "<div id='drawToolReviewTopbarTitle'>",
                            uiLabel("Review"),
                            "<div id='drawToolReviewRefresh'>",
                                uiMarkup("<div>refresh</div>"),
                                "<i class='mdi mdi-refresh mdi-18px'></i>",
                            "</div>",
                        "</div>",
                        "<div id='drawToolReviewTopbarClose'>",
                            "<i class='mdi mdi-close mdi-18px'></i>",
                        "</div>",
                    "</div>",
                    "<div id='drawToolReviewContent'>",
                        "<ul>",
                        "</ul>",
                    "</div>",
                "</div>"
            ].join('\n');

        $('#drawTool').append(uiRenderedMarkup(markup))

        $('#drawToolReviewRefresh').on('click', function () {
            DrawTool.showReview()
        })
        $('#drawToolReviewTopbarClose').on('click', function () {
            $('#drawToolReview').animate(
                {
                    opacity: 0,
                },
                250,
                function () {
                    Publish.cleanupReview()
                }
            )
        })

        DrawTool.compileFile({ verbose: true }, function (d) {
            $('#drawToolReviewContent ul *').remove()
            var liMarkup = [
                '<li class="drawToolReviewTitle">',
                uiLabel("Issues"),
                '</li>',
            ].join('\n')
            $('#drawToolReviewContent ul').append(uiRenderedMarkup(liMarkup))

            var noErrors = true
            for (var i = 0; i < d.body.issues.length; i++) {
                var s = d.body.issues[i]
                if (s.severity === 'error') noErrors = false
                var message = s.message
                if (s.hasOwnProperty('antecedent')) {
                    message = message.replace(
                        '{antecedent}',
                        "<span class='ante' shape_id='" +
                            s.antecedent.id +
                            "'>" +
                            (DrawTool.intentNameMapping[s.antecedent.intent] ||
                                s.antecedent.intent.capitalizeFirstLetter()) +
                            '(' +
                            s.antecedent.id +
                            ')' +
                            '</span>'
                    )
                }
                if (s.hasOwnProperty('consequent'))
                    message = message.replace(
                        '{consequent}',
                        "<span class='cons' shape_id='" +
                            s.consequent.id +
                            "'>" +
                            (DrawTool.intentNameMapping[s.consequent.intent] ||
                                s.consequent.intent.capitalizeFirstLetter()) +
                            '(' +
                            s.consequent.id +
                            ')' +
                            '</span>'
                    )

                var liMarkup = [
                    '<li>',
                    "<div class='" + s.severity + "'>",
                    s.severity,
                    '</div>',
                    message,
                    '</li>',
                ].join('\n')
                $('#drawToolReviewContent ul').append(uiRenderedMarkup(liMarkup))
            }

            if (noErrors) {
                $('#drawToolReviewContent ul *').remove()
                //We can show the Changes and publish button
                var liMarkup = [
                    '<li class="drawToolReviewTitle">',
                    uiLabel("Changes"),
                    '</li>',
                ].join('\n')
                $('#drawToolReviewContent ul').append(uiRenderedMarkup(liMarkup))

                //Changes
                if (d.body.changes) {
                    //Added
                    var added = d.body.changes.added
                    for (var i = 0; i < added.length; i++) {
                        var liMarkup = [
                            "<li class='changes'>",
                            uiMarkup("<div class='added'>added</div>"),
                            "<span title='" +
                                added[i].uuid +
                                "' shape_id='" +
                                added[i].id +
                                "'>" +
                                added[i].name +
                                '</span>',
                            '</li>',
                        ].join('\n')
                        $('#drawToolReviewContent ul').append(uiRenderedMarkup(liMarkup))
                    }

                    //Removed
                    var removed = d.body.changes.removed
                    for (var i = 0; i < removed.length; i++) {
                        var liMarkup = [
                            "<li class='changes'>",
                            uiMarkup("<div class='removed'>removed</div>"),
                            "<span title='" +
                                removed[i].uuid +
                                "' shape_id='null'>" +
                                removed[i].name +
                                '</span>',
                            '</li>',
                        ].join('\n')
                        $('#drawToolReviewContent ul').append(uiRenderedMarkup(liMarkup))
                    }

                    //Changed
                    var changed = d.body.changes.changed
                    for (var i = 0; i < changed.length; i++) {
                        var liMarkup = [
                            "<li class='changes'>",
                            uiMarkup("<div class='changed'>changed</div>"),
                            "<span title='" +
                                changed[i].uuid +
                                "' shape_id='" +
                                changed[i].id +
                                "'>" +
                                changed[i].old_name +
                                ' &rarr; ' +
                                changed[i].new_name +
                                '</span>',
                            '</li>',
                        ].join('\n')
                        $('#drawToolReviewContent ul').append(uiRenderedMarkup(liMarkup))
                    }
                }

                var liMarkup = [
                    '<li id="drawToolReviewPublish">',
                    uiMarkup("<div>Publish</div>"),
                    '</li>',
                ].join('\n')
                $('#drawToolReviewContent ul').append(uiRenderedMarkup(liMarkup))
            } else {
                var liMarkup = [
                    '<li id="drawToolReviewMessage">',
                    uiLabel("All errors must be resolved before publishing."),
                    '</li>',
                ].join('\n')
                $('#drawToolReviewContent ul').append(uiRenderedMarkup(liMarkup))
            }

            $('#drawToolReviewContent ul li > span').on(
                'mouseenter',
                function () {
                    $(
                        '.drawToolShapeLi[shape_id="' +
                            $(this).attr('shape_id') +
                            '"] .drawToolShapeLiItem'
                    ).mouseenter()
                }
            )
            $('#drawToolReviewContent ul li > span').on(
                'mouseleave',
                function () {
                    $(
                        '.drawToolShapeLi[shape_id="' +
                            $(this).attr('shape_id') +
                            '"] .drawToolShapeLiItem'
                    ).mouseleave()
                }
            )
            $('#drawToolReviewContent ul li > span').on('click', function () {
                $(
                    '.drawToolShapeLi[shape_id="' +
                        $(this).attr('shape_id') +
                        '"] .drawToolShapeLiItem'
                ).click()
            })

            //Publish
            var publishing = false
            $('#drawToolReviewPublish').on('click', function () {
                if (!publishing) {
                    publishing = true
                    calls.api(
                        'files_publish',
                        {},
                        function () {
                            $('#drawToolReviewPublish').html(
                                uiRenderedMarkup(uiMarkup("<div>Published!</div>"))
                            )
                            $('#drawToolReviewPublish').css({
                                background: '#26ff2b',
                            })
                            $('#drawToolReviewPublish > div').css({
                                color: '#001 !important',
                            })
                        },
                        function () {
                            $('#drawToolReviewPublish').html(
                                uiRenderedMarkup(uiMarkup("<div>Publish Failed</div>"))
                            )
                            $('#drawToolReviewPublish').css({
                                background: '#ff2626',
                            })
                            setTimeout(function () {
                                publishing = false
                                $('#drawToolReviewPublish').html(
                                    uiRenderedMarkup(uiMarkup("<div>Publish</div>"))
                                )
                                $('#drawToolReviewPublish').css({
                                    background: '#5d26ff',
                                })
                            }, 4000)
                        }
                    )
                }
            })
        })
    },
}

export default Publish
