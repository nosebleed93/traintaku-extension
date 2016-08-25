$(function () {
  try {

    var backgroundScript = chrome.extension.getBackgroundPage(),
      imageList = backgroundScript.fileList,
      staticSettings = backgroundScript.staticSettings,
      $rawList = $('#rawList');

    console.log(staticSettings)

    chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {
        try {

          console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
          if (request.imageUrl != undefined) {
            if (staticSettings.previewImages) {
              methods.addImageToView(request.imageUrl);
            }
            $rawList.val($rawList.val() + '\n' + request.imageUrl);
          }
        } catch (e) {
          console.error(e);
        }

      });

    imageList.forEach(function (imageUrl) {
      if (staticSettings.previewImages) {
        methods.addImageToView(imageUrl);
      }

      $rawList.val($rawList.val() + '\n' + imageUrl);
    });

    if (staticSettings.previewImages) {
      $('#imageList').parent().removeClass("hide");
      console.log('displaying images')
    }

    $('.clearAllImages').on('click', function () {
      methods.clearAllImages();
    });

    $('.sendImages').on('click', function () {
      var background = chrome.extension.getBackgroundPage(),
        requestData,
        $form = $rawList.parents('form');

      requestData = $form.serialize();

      $.ajax({
        type: 'post',
        url: 'http:127.0.0.1:3100/extension/scanUrls',
        contentType: 'application/x-www-form-urlencoded',
        crossDomain: true,
        data: requestData,
        success: function () {
          console.log('worked')
        },
        error: function (e) {
          console.error('failed', e)
        }
      })

    });

    $('.previewToggle').on('click', function () {
      var background = chrome.extension.getBackgroundPage();

      if (background.staticSettings.previewImages) {
        background.staticSettings.previewImages = false;
        background.methods.saveSettings();
        $('#imageList').parent().addClass('hide');

      } else {
        background.staticSettings.previewImages = true;
        background.methods.saveSettings();
        $('#imageList').parent().removeClass('hide');

        imageList.forEach(function (imageUrl) {
          methods.addImageToView(imageUrl);
        });
      }


    })

    $('.clearSettings').on('click', function () {
      localStorage.removeItem("settings");

      chrome.extension.getBackgroundPage().methods.loadSettingsFromFile();
    });


  } catch (e) {
    console.error('failure while loading popup page', e);
  }
});

var methods = {
  addImageToView: function (imageUrl) {
    var $imageList = $('#imageList'),
      $imageRow = $('#rowTemplate').clone();

    var $image = $imageRow.find('.sample-image');
    $image.attr('src', imageUrl);
    // $image.attr('src', '../img/gears.gif');
    // $image.attr('data-src', imageUrl);

    $image.parent().attr('href', imageUrl);

    $imageRow.removeClass('hide');
    $imageRow.removeAttr('id');


    var $li = $(document.createElement('li'));
    $li.append($imageRow);

    $imageList.append($li);
  },
  clearAllImages: function () {
    var imageList = document.getElementById('imageList');
    console.log('removing images')
    $('#rawList').val(' ');

    while (imageList.hasChildNodes()) {
      imageList.removeChild(imageList.lastChild);
    }
  }
}