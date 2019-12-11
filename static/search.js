var PER_PAGE = 3 * 10;
var clusterize = new Clusterize({ //clusterize prerares title search output
  scrollId: 'scrollArea',
  contentId: 'contentArea'
});

function hasAttr(attr) {
  return (typeof attr !== typeof undefined && attr !== false)
}

function werkSearchNext(e) {
  var ppp = $('button#more').data('page');
  werkSearchStart(e, ppp + 1);
}

function werkSearchRandom(e) {
//  console.log('random');
  werkSearchStart(e, -1);
}

function werkSearchBack(e) {
  if (typeof e !== typeof undefined)
    e.preventDefault(); e.stopPropagation();

  var $det = $('#details').hide(); $('#browser').show();

  // $('.top.container').css('visibility', 'visible');
  // $('#results').show();
}

function werkSearchReset(e) {
  if (typeof e !== typeof undefined)
    e.preventDefault(); e.stopPropagation();

  // Clear the form and return to start when tapped
  $('form')[0].reset();
  /*$('#filters a:first').click();*/ //shows first nav tab.
  $('#total').text('0');
  $('#start').addClass('disable'); /* Anzeigen ausblenden */
  $('#restart').addClass('disable'); /* Neuauswahl ausblenden */
  $('#results').hide(); /* hides results */
  $('#filters .tab-content').show(); /*shows search form*/
  
  // Show the counters again
  // $('.form-check small').css('visibility', 'visible');
}

// Query builder
function get_werkSearchQuery(from_page) {
  var q = '?sort=-Jahr&';
  q += 'per_page=' + PER_PAGE;

  if (from_page === -1) {
    from_page = 1;
    ranval = Math.round(1+(Math.random() * 6899));
    $('form')[0].reset();
    $('input[name="Nummer"]').val(ranval);
  }

  var ppp = (typeof from_page === typeof 1) ? from_page : 1;
  q += '&page=' + ppp;

  filterselect = '';
  filterdata = {};

  $('input:checked').each(function() {
    var nm = $(this).attr('name');
    if (!hasAttr(nm)) return;
    if (!filterdata[nm]) filterdata[nm] = [];
    filterdata[nm].push($(this).attr('value'));
    filterselect += '<span>' + $(this).parent().find('label').text() + '</span>';
  });

  $('input[type=text]').each(function() {
    var nm = $(this).attr('name');
    if (!hasAttr(nm)) return;
    if (!nm.indexOf('o_') == 0) nm = 'o_' + nm;
    var v = $(this).val();
    if (!v.length) return;
    if (!filterdata[nm]) filterdata[nm] = [];
    filterdata[nm].push(v);
    filterselect += '<span>' + v + '</span>';
  });

  $.each(Object.keys(filterdata), function() {
    q += '&' + this + '=' + filterdata[this].join(',');
  });

  return {
    data: filterdata,
    html: filterselect,
    page: ppp,
    query: q
  }
}

// Obtains a count of search results
function werkSearchCount() {
  qg = get_werkSearchQuery(1);
  $('#selection').empty().append(qg.html);
  if (qg.html === '') return $('#total').text('0');

  $.getJSON('/api/images' + qg.query, function(data) {
    $('#total').html(data.total);
    $('#start').removeClass('disable')
      .addClass(data.total > 0 ? '' : 'disable');
  });
}

// Generates an image subtitle
function werkTitle(item) {
  console.log("werkTitle "+item['Titel']);
  var Techniken = '';
  if (item['Techniken'] !== null) {
    var itemarr = [];
    item['Techniken'].split(' ').forEach(function(t) {
      getcode = cache.find(f => f['Code'] == t.trim())
      if (typeof getcode !== 'undefined') {
        if (getcode.Title.toLowerCase().indexOf('technik') > 0) return;
        itemarr.push( getcode.Title );
      }
    })
    Techniken = itemarr.join(', ');
  }
  var s = '' +
    '<b>' + (item['Titel'] || '(Ohne Titel)') + '</b> ' +
    '[' + item['Nummer'] + '], ' +
    '' + Techniken + ', ' +
    '' + item['Format'] + 'cm' +
    '' + (item['Jahr'] !== null ?
    ', ' + item['Jahr'].replace('a', '') + '' : '') +
    '' + (item["Zus'arbeit"] !== null ?
    ', In Zusammenarbeit mit ' + item["Zus'arbeit"] : '') +
    '' + (item ['Status'] !== null ?
      ', ' + item ['Status'] : '')  
    ;
  return s;
}

// Generates list of Titles, stores them in global titlelist
function listTitles() {
  q = '?sort=-Jahr&per_page=-1';
  let titleItems = [];

  $.getJSON('/api/images.json' + q, function(data) {
    // Create title item array
    data.forEach(function(item, index) {
      if (item['Titel'] != null) {
        fixedItem = '<div>'+item['Titel']+'</div>';
        fixedItem = fixedItem.replace(/"/g, '\'');
        titleItems.push(fixedItem);
      }
    });
    titleItems.sort(function (a, b) {
      return a.localeCompare(b);
    });

    titlelist = titleItems; //global zugänglich.
    titlelist_uniqueEntries = removeDuplicates(titlelist) //removes duplicates and stores it globally.

    clusterize.update(titlelist_uniqueEntries);
  });
}

function countDuplicates(names) {
  var  count = {};
  names.forEach(function(i) { count[i] = (count[i]||0) + 1;});
  console.log(count);
}

function removeDuplicates(names) {
  let unique = {};
  names.forEach(function(i) {
    if(!unique[i]) {
      unique[i] = true;
    }
  });
  return Object.keys(unique);
}

// Main function to run an search
function werkSearchStart(e, from_page) {
  if (from_page == typeof undefined)
    from_page = 1;
  if (typeof e !== typeof undefined)
    e.preventDefault(); e.stopPropagation();

  if ($('#start').hasClass('disable')) return;

  $('.modal').modal('show');
 
  wsq = get_werkSearchQuery(from_page);
  q = wsq.query;

  // Update page number
  $('button#more').data('page', wsq.page);
  if (wsq.page == 1) {
      $('#results').find('div.row').empty();
  }

  $.getJSON('/api/images.json' + q, function(data) {
    setTimeout(function() {
      $('.modal').modal('hide');
    }, 500);

    $('#filters .tab-content').hide();
    //$('#filters .nav-item.nav-link.btn_bildarchiv').removeClass('active');
    /*$('#filters .show.active').removeClass('show active');*/

    var $tgt = $('#results').show().find('div.row');

    $('button#more').hide();
    if (data.length == PER_PAGE)
      $('button#more').show();

    var pswpElement = $('.pswp')[0];
    var pswpItems = [];
    var pswpGallery = null;

    // Create item index
    data.forEach(function(item, ix) {
      console.log(item);
      pswpItems.push({
        src: item.path, w: 0, h: 0,
        title: werkTitle(item)
      });
    });

    // Generate thumbnails
    data.forEach(function(item, ix) {
      $tgt.append(

        '<div class="col-sm-2 item">' +
          '<img src="' + item.thumb + '" />' +
          // '<small>' + item.Nummer + '</small>' +
        '</div>'

      ).find('.item:last').click(function() {

        // console.debug(item, ix);
        var pswpOptions = { index: ix, loop: false };
        pswpGallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default,
          pswpItems, pswpOptions);
        pswpGallery.listen('imageLoadComplete', function (index, item) {
          if (item.h < 1 || item.w < 1) {
            let img = new Image();
            img.onload = () => {
              item.w = img.width;
              item.h = img.height;
              pswpGallery.invalidateCurrItems();
              pswpGallery.updateSize(true);
            }
            img.src = item.src;
          }
        });
        pswpGallery.init();
        // pswpGallery.goTo(ix);

      });

    }); // -data each

    if (data.length == 1)
      $tgt.find('.item:last').click();

  }).fail(function(jqxhr, textStatus, error) {
    alert('Could not search!');
//    console.log(textStatus, error);
  });
}
