<!--

/*  ************************************************************************  *
 *                                document.js                                 *
 *  ************************************************************************  */

/*  Load from the HEAD of each "document" page - but only after MASTER.JS 
    and do not add the DEFER attribute! 

    Familiarity with MASTER.JS is assumed.  */

/*  ************************************************************************  */
/*  Background  */

/*  A "document" is an essentially arbitrary page at this website. It is 
    written as its own content but may be (and ideally is) presented in some 
    sort of viewer. What this means now, if not forever, is that the 
    document shows in one pane (or panel) along with others for a banner 
    across the top and a Table of Contents (TOC) to the left. Getting the 
    document into the viewer is the primary business of this script. Without 
    this script, the document shows in the whole of the browser window (or 
    in whatever frame someone else's site has tried to host it in). 

    It cannot be stressed enough how important is the preceding design. 
    Pages at this site must be preparable as naturally as possible in an 
    HTML editor for self-standing presentation, both for the author's 
    convenience when writing them and especially so that they show 
    acceptably to users who disable scripting. 

    Required Stylesheets and Scripts 
    -------------------------------- 

    The implementation here requires that every document page has a HEAD 
    that loads at least two stylesheets and two scripts. The reason for 
    having two of each is that the first (MASTER.CSS and MASTER.JS) contain 
    whatever is imagined might be used not just in the second (DOCUMENT.CSS 
    and DOCUMENT.JS) but also in scripts and stylesheets for pages that 
    aren't intended as document pages (notably, BANNER.HTM and the various 
    TOC.HTM pages). 

    Document pages may load more scripts, of course, but for as long as 
    pages at this site have loaded any scripts at all, MASTER.JS and 
    DOCUMENT.JS have been the minimal requirement. Thousands of pages have 
    been prepared on this basis. These are not any time soon, if ever, going 
    to be edited and re-uploaded. Thus does loading MASTER.JS and 
    DOCUMENT.JS remain the minimal requirement. 

    Scripting for the document page's interactivity has been moved to a new 
    script named DOCUI.JS. This gets loaded by all document pages but not 
    directly by themselves. It is instead loaded by this script as its last 
    work on first execution. Also loaded by this script is a new stylesheet 
    named VIEWER.CSS whose rules are meaningful only for a document page 
    that has been re-presented in the viewer. 

    No DEFER Attribute 
    ------------------ 

    Rebuilding the DOM tree to re-present the document in the viewer does 
    quite some violence to the layout. It's not in anyone's interests to 
    have the document page show, even fleetingly, styled or not, in advance 
    of the scripts getting to work. Therefore, we really do want that the 
    SCRIPT tag for DOCUMENT.JS does not have the DEFER attribute. 

    Be clear on this point. To specify DEFER for these scripts tells the 
    browser to request the scripts asynchronously and proceed immediately to 
    showing the document - all of Style calculation, Layout and Paint in 
    Internet Explorer, and Recalculate Style, Layout and Pre-Paint and Paint 
    in the Chromium Edge - before the scripts have even been downloaded, let 
    alone before they get to execute.  */

/*  *************  */
/*  Configuration  */

/*  Historically, the viewer truly was a frameset, i.e., with FRAMESET and 
    FRAME nodes. Go back far enough and the scheme depended on a VIEWER.HTM 
    that provided the frameset as HTML. This was scrapped in 2011 to build 
    the frameset dynamically. Still, the history persists in that the viewer 
    and its banner, TOC and document panels are sometimes still referred to 
    as a frameset and frames - both in comments and in the names of 
    functions and variables. 

    Each "frame" has a name - once upon a time truly the NAME attribute of a 
    FRAME - so that scripts running in the frames can identify that they are 
    in the correct frame. Each name was also an ID (and is still, but now of 
    an IFRAME or DIV). This ID must match with VIEWER.CSS. Each also names a 
    property of the Viewer object that is built by this script. 

    Since 2021, the viewer is instead a set of BODY, DIV and IFRAME nodes. A 
    document page starts with a straightforward DOM tree of nodes created 
    from tags in some straightforward HTML: 

    HTML
      HEAD
      BODY
        content 

    This script rearranges this part of the tree to: 

    HTML                id="Viewer"             original, with new ID
      HEAD                                      original, edited inside
      BODY              id="ViewerBody"         original, reworked beneath
        DIV             id="TopRow"
          DIV           id="BannerDiv"
            IFRAME      id="BannerFrame"        src="banner.htm"
        DIV             id="MainRow"
          DIV           id="TocDiv"
            IFRAME      id="TocFrame"           src="toc.htm"
          DIV           id="TocDocDiv"
          DIV           id="DocDiv"
            DIV         id="DocFrame"
              content                           from BODY

    The TopRow is in some sense superfluous, existing just for the symmetry 
    of having all the *Frame nodes (whether IFRAME or DIV) at the same 
    depth. 

    In another sense it is one of the viewer's three key contact points. The 
    TopRow and MainRow at the top of the tree are the viewer's attachment 
    points to the BODY (such that they become the BODY's only children). The 
    DocFrame at the bottom is the attachment site for the BODY's original 
    children, i.e., what the reader perceives as the document's content. 

    The viewer, then, is the TopRow, MainRow and DocFrame and everything 
    in-between (short of peering into the IFRAME nodes). Each node in this 
    viewer has an ID which gets its styling from VIEWER.CSS.  */

Config.ViewerIds = {
    Html: "Viewer",             // HTML 
    Body: "ViewerBody",         // BODY, contains TopRow and MainRow 
    TopRow: "TopRow",           // DIV, contains BannerDiv 
    MainRow: "MainRow",         // DIV, contains TocDiv, TocDocDiv and DocDiv 
    BannerDiv: "BannerDiv",     // DIV, contains BannerFrame 
    TocDiv: "TocDiv",           // DIV, contains TocFrame 
    TocDocDiv: "TocDocDiv",     // DIV, empty but interactive 
    DocDiv: "DocDiv",           // DIV, contains DocFrame 
    BannerFrame: "BannerFrame", // IFRAME, contains BANNER.HTM 
    TocFrame: "TocFrame",       // IFRAME, contains TOC.HTM 
    DocFrame: "DocFrame"        // DIV, contains original BODY content 
};

/*  If something goes wrong with loading content into an IFRAME, a TITLE can 
    show as a tooltip over the frame's placeholder. Not all browsers help 
    this way, though.  */

Config.FrameHints = {
    BannerFrame: "Banner for Geoff Chappell site",
    TocFrame: "Table of Contents for Geoff Chappell site"
};

/*  The banner is always loaded from the one file for the whole site.  */

Config.BannerPathname = "/banner.htm";

/*  What gets loaded into the TOC frame depends on the document page. The 
    site is organised as a collection of subwebs. This term dates from when 
    each actually was a subweb in the sense defined by Front Page (and 
    preseved, if hidden, in Expression Web). 

    There is one TOC in each subweb. Each subweb's TOC has the same 
    filename. Paths for the subwebs, being properties of the whole site, are 
    defined in MASTER.JS.  */

Config.TocFilename = "toc.htm";

/*  The viewer has its own stylesheet - not just for the nodes that the 
    viewer adds but also to restyle DOCUMENT.CSS. Document pages aren't 
    written to know about this any more than they know about their 
    presentation in the viewer. The extra stylesheet is loaded dynamically 
    by this script.  */

Config.ViewerCssPathname = "/_styles/viewer.css";

/*  As noted, interactivity is handled by a separate script. Again, document 
    pages are written with no knowledge of this.  */

Config.DocUIScriptPathname = "/_scripts/docui.js";

/*  We add a Content Security Policy to the HEAD of every document page that 
    doesn't already have one. If only in principle it is configurable.  

    All document pages seek to load scripts and stylesheets. All load images 
    too (if not for themselves, then in the TOC). This script creates 
    frames. In all these cases, what's loaded is only from elsewhere at this 
    website. For all other types of resource that are subject to the policy, 
    the site never loads anything at all, not even from itself. 

    And there it ends for almost all document pages. The base-uri and 
    form-action policies are added explicitly because they are not covered 
    by falling back to default-src. 

    Any document page that needs a more relaxed CSP, e.g., to support 
    DEMO.JS, must set its own META in the HTML. Notably, DEMO.JS needs 
    both 'unsafe-eval' 'unsafe-inline' as additions for script-src. 

    If the CSP is set at the server to send in all HTTP Response Headers, it 
    will need to be no more strict than the least strict of any META. 

    TO DO: 

    There may be some question of precedence. A META cannot relax a policy 
    from the headers, but it's unclear that strengthening is always 
    respected. Some experimentation looks to be required: not only have the 
    promoters of the Content Security Policy not been nearly as definitive 
    as might be wanted but they also didn't provide an easy means of 
    discovering what policy applies.  */

Config.DefaultContentSecurityPolicy = "base-uri 'none'; \
default-src 'none'; \
form-action 'none'; \
frame-src 'self'; \
img-src 'self'; \
script-src 'self'; \
style-src 'self'";

/*  ************************************************************************  */
/*  Head  */

/*  Revision in 2021 created a new stylesheet and a new script that are both 
    to be loaded by every document page. This has in turn required some 
    editing of the HEAD. 

    The new stylesheet, VIEWER.CSS, is specialised to the presentation of 
    document pages in the viewer. To have every document page load this 
    stylesheet would be a waste, at best, when scripts don't run. Anyway, 
    the site's thousands of pages will not any time soon be edited and 
    re-uploaded to the live server. This consideration applies also to the 
    new script, DOCUI.JS, which is specialised to the common interactivity 
    of all document pages when presented in the viewer. The new stylesheet 
    and script are therefore loaded dynamically by this script. The 
    standards are not known to leave any way to add a stylesheet dynamically 
    except by editing an appropriate LINK into the HEAD. 

    The work is split into the general and the particular. The general was 
    for a while exposed also to TOC.JS since it also has a new script for 
    interactivity. Though this is not needed now, all seven TOC.HTM files 
    having been edited and uploaded, the separation is retained for its 
    neatness.  */

/* -------------------------------------------------------------------------  */

/*  Create a Head object and call its methods only during the initial 
    execution of some script that was itself loaded from a SCRIPT tag in a 
    HEAD tag. Really, the only callers should be DOCUMENT.JS, BANNER.JS and 
    TOC.JS (the last two operating on the HEAD in BANNER.HTM and TOC.HTM 
    respectively). 

    The HEAD is sure to exist and its nodes are sure to reach the SCRIPT tag 
    that got the caller's script loaded. More importantly, since the browser 
    is known to be still working on the HEAD (being still some way from even 
    looking at the BODY), it's not unreasonable to hope that the browser 
    will notice insertions and act on them much as if the newly inserted 
    node had been a tag in the HTML. 

    The constructor takes one argument: the window object for the page whose 
    HEAD is to be mapped and edited.  */

function Head (Window)
{
    /*  First, of course, we must find the HEAD element. Microsoft didn't 
        give the document object a head property until Internet Explorer 9. 
        Be prepared to fall back to finding the HEAD as a child of the HTML 
        node. 

        While anticipating going through the HTML node, take the opportunity 
        to ensure that it has a lang property. That the HTML tag be given a 
        LANG attribute is nowadays recommended not just as if omission is 
        neglect but as if everyone has been recommending it forever. Yet at 
        least until 2008 Microsoft didn't document LANG as even a possibility 
        for the HTML tag.  */

    this.Document = Window.document;

    var html = this.Document.documentElement;
    if (!html.lang) html.lang = "en";

    var head = this.Document.head;
    if (head == null) {
        head = html.firstChild;
        while (head.nodeName != "HEAD") {
            head = head.nextSibling;
        }
    }
    this.Head = head;

    /*  Much of the point to parsing the HEAD is that we'll add to it. We 
        prefer to keep the HEAD ordered neatly: a META for CHARSET (and some 
        selected others); a TITLE; and then arbitrary more META, possibly a 
        BASE, and then LINK, STYLE and SCRIPT nodes. Ideally, the HEAD 
        already has this order. We take as granted that the HEAD has at 
        least one SCRIPT (else who are we running). 

        Along the way to marking out where each area of the HEAD starts, we 
        notice whether particular nodes are already present.  */

    var firstnode = null;
    var title = null;
    var base = null;
    var firstlink = null;
    var firstcss = null;
    var firststyle = null;
    var firstscript = null;

    this.Charset = null;
    this.Csp = null;
    this.Viewport = null;
    this.Canonical = null;

    /*  Enumerate the HEAD's children. The technique here is to get the 
        childNodes collection and then execute a callback routine for each 
        member.  */

    this.Enumerator = function (Node) {

        /*  The childNodes collection contains not just elements that are 
            immediate children but also nodes for text, comments, and who's 
            to care what else. We care only for elements.

            Modern browsers provide a collection named children that is only 
            of elements - but it's here regarded as problematic because 
            Internet Explorer had this name all along for something very 
            similar but perhaps subtly different.  */

        if (Node.nodeType != 1) return;

        if (firstnode == null) firstnode = Node;

        switch (Node.nodeName) {

            case "BASE": {
                if (base == null) base = Node;
                return;
            }

            case "LINK": {

                if (firstlink == null) firstlink = Node;

                if (this.Canonical != null && firstcss != null) return;

                var rel = Node.rel;
                if (!rel) return;

                switch (rel.toUpperCase ()) {
                    case "CANONICAL": {
                        if (this.Canonical == null) this.Canonical = Node;
                        return;
                    }
                    case "STYLESHEET": {
                        if (firstcss == null) firstcss = Node;
                        return;
                    }
                }
                return;
            }

            case "META": {

                if (this.Charset == null) {
                    if (Node.charset) {
                        this.Charset = Node;
                        return;
                    }
                }

                if (this.Csp == null) {
                    var equiv = Node.httpEquiv;
                    if (equiv) {
                        if (equiv.toUpperCase () == "CONTENT-SECURITY-POLICY") {
                            this.Csp = Node;
                            return;
                        }
                    }
                }

                if (this.Viewport == null) {
                    var name = Node.name;
                    if (name) {
                        if (name.toUpperCase () == "VIEWPORT") {
                            this.Viewport = Node;
                            return;
                        }
                    }
                }
                return;
            }

            case "SCRIPT": {
                if (firstscript == null) firstscript = Node;
                return;
            }

            case "STYLE": {
                if (firststyle == null) firststyle = Node;
                return;
            }

            case "TITLE": {
                if (title == null) title = Node;
                return;
            }
        }
    };

    CollectionForEach (head.childNodes, this.Enumerator, this);

    /*  Record the insertion endpoints for different types of node: First 
        for META that are expected at the very start of the HEAD; PreTitle 
        for META that are important enough to precede even the TITLE; Meta 
        for all other META; Link for all LINK that don't load stylesheets; 
        Css for all LINK that do load stylesheets; Script for all SCRIPT.  */

    // this.EndScript = null;
    this.EndCss = firststyle != null ? firststyle : firstscript;
    this.EndLink = firstcss != null ? firstcss : this.EndCss;
    this.EndMeta = base != null ? base : firstlink != null ? firstlink : this.EndLink;
    this.EndPreTitle = title != null ? title : this.EndMeta;
    this.EndFirst = firstnode;
};

/*  Methods for inserting nodes  */

Head.prototype.InsertCharsetMeta = function () 
{
    var node = this.Document.createElement ("META");
    node.charset = "utf-8";
    this.Head.insertBefore (node, this.EndFirst);
    return node;
};

Head.prototype.InsertHttpEquivMeta = function (HttpEquiv, Content) 
{
    var node = this.Document.createElement ("META");
    node.httpEquiv = HttpEquiv;
    node.content = Content;
    this.Head.insertBefore (node, this.EndPreTitle);
    return node;
};

Head.prototype.InsertNameMeta = function (Name, Content) 
{

    /*  Versions of Internet Explorer before 8 have trouble with the name 
        property except by creating the node in a special way (which is 
        buried into a helper function in MASTER.JS).  */

    var node = CreateElementWithName (this.Document, "META", Name);
    if (node == null) return null;
    node.content = Content;
    this.Head.insertBefore (node, this.EndMeta);
    return node;
};

Head.prototype.InsertStylesheetLink = function (Pathname) 
{
    /*  For ages, software for preparing HTML would insist that a LINK for a 
        stylesheet must specify the TYPE. Nowadays, the recommended practice 
        is to omit the TYPE.  */

    var node = this.Document.createElement ("LINK");
    node.rel = "stylesheet";
    node.type = "text/css";
    node.href = Pathname;
    this.Head.insertBefore (node, this.EndCss);
    return node;
};

Head.prototype.InsertCanonicalLink = function (Url) 
{
    var node = this.Document.createElement ("LINK");
    node.rel = "canonical";
    node.href = Url;
    this.Head.insertBefore (node, this.EndLink);
    return node;
};

Head.prototype.InsertDeferredScript = function (Pathname) 
{
    /*  It may be that the defer property has no effect (at all) here. The 
        async property is another story, apparently. The browsers that have 
        it at all, have it as true by default (in this situation). 

        That we presently set it as false is because it seemed to be needed 
        in early development, apparently to ensure that DOCUI.JS is done 
        with its initial execution before DOCUMENT.JS sees the load event. 
        This expectation was removed long ago in favour of having 
        DOCUMENT.JS call an initialisation function in DOCUI.JS as its first 
        use of DOCUI functionality. Sometime, then, revisit whether we can - 
        and should want to - set async as true.  */

    var node = this.Document.createElement ("SCRIPT");
    node.async = false;
    node.charset = "utf-8";
    node.defer = true;
    node.src = Pathname;
    node.type = "text/javascript";
    this.Head.appendChild (node);
    return node;
};

/*  Methods for ensuring the presence of nodes that are nowadays recommended 
    but which the author did not have the foresight (a decade earlier) to 
    write into all document pages  */

Head.prototype.EnsureCharsetMeta = function () 
{
    if (this.Charset == null) {
        this.Charset = this.InsertCharsetMeta ();
    }
    return this.Charset;
};

Head.prototype.EnsureCspMeta = function (Content) 
{
    if (this.Csp == null) {
        this.Csp = this.InsertHttpEquivMeta (
            "Content-Security-Policy", 
            Content);
    }
    return this.Csp;
}

Head.prototype.EnsureViewportMeta = function (Content) 
{
    if (this.Viewport == null) {
        this.Viewport = this.InsertNameMeta ("viewport", Content);
    }
    return this.Viewport;
};

Head.prototype.EnsureCanonicalLink = function (Url) 
{
    if (this.Canonical == null) {
        this.Canonical = this.InsertCanonicalLink (Url);
    }
    return this.Canonical;
};

/*  The EditHead function is particular to document pages. Call it almost as 
    soon as we set about constructing the viewer during our earliest 
    execution - see ConstructViewer, far below - and certainly before the 
    browser moves on to the BODY.  */

function EditHead ()
{
    var head = new Head (window);

    /*  Another recommendation that is nowadays made as if forever is that 
        the HEAD should start with a META tag for the CHARSET. Since late 
        2007, every page at this website has a META tag with HTTP-EQUIV set 
        to Content-Type and with CONTENT specifying the CHARSET. But this 
        apparently is not new enough: all the world's web pages that ever 
        took old advice should now be updated! 

        Setting the CHARSET through HTTP-EQUIV was still Microsoft's 
        recommended practice as late as 2010. Microsoft's documentation in 
        2008 didn't even allow for CHARSET as a META attribute. 

        Adding a <META CHARSET> this late, when the browser may already have 
        acted definitively on the HEAD elements it has already parsed, seems 
        unlikely to have much merit, but it does stop various development 
        tools from objecting to the absence.  */

    head.EnsureCharsetMeta ();

    /*  Another new expectation is a Content Security Policy (CSP). It is 
        ideally delivered by the server as an HTTP response header but it is 
        also recognised if set into the page as a META. 

        Again, we're not about to edit and re-upload thousands of pages just 
        for this.  */
        
    head.EnsureCspMeta (Config.DefaultContentSecurityPolicy);

    /*  All the current advice on best practice would have it that every web 
        page should have a very particular META tag for the viewport. The 
        advice seems to take as granted that readers will of course proceed 
        to designing every web page for showing on the narrow screens of 
        mobile phones so that this META tag is appropriate. 

        Given that our stylesheets do make some effort to adjust for narrow 
        viewports, we might reasonably have this META tag. Of course, we're 
        not about to edit it into thousands of old pages and then trouble 
        over uploading them all to the live server. Instead have the script 
        back-fit the tag as a DOM element. Maybe it gets noticed and acted 
        on, maybe not.  */

    head.EnsureViewportMeta ("width=device-width, initial-scale=1");

    /*  Especially since the website itself adds to the URL search string, 
        there may be a substantial benefit to gain from recommending to web 
        crawlers (and the like) a canonical URL that's free of such 
        additions. We even get to do such things as recommend HTTPS over 
        ordinary HTTP and hint that we prefer URLs to hit the index.htm page 
        directly not its directory.  */

    var canonical = ComposeCanonicalUrl (window);
    if (canonical != null) head.EnsureCanonicalLink (canonical);

    /*  The elements that we build between the existing body and its 
        children have a separate stylesheet (VIEWER.CSS). Loading it by 
        creating it as a LINK element in the HEAD seems at best cumbersome: 
        what could go wrong? Internet Explorer used to give the document 
        object a createStyleSheet method that did exactly what's wanted 
        here.  */

    head.InsertStylesheetLink (Config.ViewerCssPathname);

    /*  All scripting of interactivity of both the viewer and the original 
        document has been moved to a separate script. This too we bring to 
        the browser's attention by inserting an element in the HEAD.  */

    head.InsertDeferredScript (Config.DocUIScriptPathname);
}

/*  ************************************************************************  */
/*  Viewer  */

/*  The Viewer object is created during global initialisation. Its 
    constructor's one argument is a ParsedSearch object - see MASTER.JS - 
    that is created the search string from whatever URL got the document 
    loaded. 

    Some, even many, of the Viewer's methods are also defined in DOCUI.JS. 

    The Viewer is written for generality as an object that may have multiple 
    instantiations even though only one instance ever is created.  */

function Viewer (Search)
{
    /*  Keep the parsed URL search string for common benefit. TOC.JS uses 
        this.  */

    this.Search = Search;

    /*  If only for definiteness, be explicit about initialising properties.  

        These first few are references that we keep to some of the DOM 
        elements that we create.  */

    this.TocDiv = null;
    this.TocDocDiv = null;
    this.DocDiv = null;

    this.BannerFrame = null;
    this.TocFrame = null;
    this.DocFrame = null;

    /*  Same again but for references to each frame's window object  */

    this.BannerWindow = null;
    this.TocWindow = null;

    /*  When TOC.JS is sufficiently ready in its window, it tells us of its 
        Toc object.  */

    this.TocObject = null;

    /*  Data about the TOC width and our changing of it (mostly in the 
        separate DOCUI script)  */

    this.SpecifiedTocWidth = null;
    this.TocResizeEvents = null;
    this.TocResizeState = null;

    /*  For scripts that load after DOCUMENT.JS and might listen for the 
        document's load event except that they need the certainty that the 
        viewer has been built  */

    this.OnInserted = [];
    this.OnShowing = [];
}

/*  ======================  */
/*  State-Change Callbacks  */

/*  Other scripts may arrange - indirectly, see the section named External - 
    for notification at various stages of the viewer's re-presentation of the 
    document's content. 

    What the callers provide is a function whose one argument is the Viewer. 
    What's scheduled with the browser is slightly different. The following 
    helper creates the one from the other.  */

Viewer.prototype.CreateAnimationFrameCallback = function (Callback)
{
    var viewer = this;
    return function (TickCount) {
        Callback (viewer);
        return true;
    };
};

Viewer.prototype.CallWhenInserted = function (Callback)
{
    this.OnInserted.push (this.CreateAnimationFrameCallback (Callback));
};

Viewer.prototype.CallWhenShowing = function (Callback)
{
    this.OnShowing.push (this.CreateAnimationFrameCallback (Callback));
};

Viewer.prototype.CallBack = function (Callback)
{
    RequestAnimationFrame (this.CreateAnimationFrameCallback (Callback));
};

Viewer.prototype.OnCallbacksDone = function ()
{
    this.CallWhenInserted = this.CallBack;
    this.OnInserted = null;
    this.CallWhenShowing = this.CallBack;
    this.OnShowing = null;
};

/*  ===========  */
/*  Frame Query  */

/*  Also exposed (indirectly) to other scripts is a method for confirming 
    that the given Window is the expected frame in the viewer.  */

Viewer.prototype.IsWindowInFrame = function (Window, Id) 
{
    /*  Any caller who expects to be in one of our frames must not be in 
        this window - but the window they are in must have this one as its 
        top window.  */

    if (Window == window || Window.top != window) return false;

    /*  Moreover, we have no nesting of frames in frames, and so the 
        caller's window must have this one as its parent, specifically.  */

    var parent = Window.parent;
    if (parent != null && parent != window) return false;

    /*  The caller's window must host an IFRAME which in turn must have the 
        given Id as its id property.  */

    var frame = Window.frameElement;
    if (frame == null || frame.tagName != "IFRAME" || frame.id != Id) {
        return false;
    }

    /*  But is this IFRAME with the expected ID specifically the IFRAME that 
        the Viewer created with this ID?  */

    switch (Id) {
        case Config.ViewerIds.BannerFrame: {
            return frame == this.BannerFrame;
        }
        case Config.ViewerIds.TocFrame: {
            return frame == this.TocFrame;
        }
    }

    return false;
};

/*  Whether the viewer's banner and TOC frames ever do get windows is more 
    complicated than may seem. Ordinarily, a window for the frame's browsing 
    context is created when the frame is inserted into a document. It is 
    then available as the frame's contentWindow property. 

    But the browser's support for frames cannot be taken for granted. This 
    was explicit in the days of FRAMESET, when there was even a NOFRAMES tag 
    for providing HTML for the browser to render if it can't (or won't) 
    display the frame. That support for IFRAME is similarly conditional 
    tends nowadays to be overlooked. Internet explorer is easily told not to 
    create a browser context for an IFRAME: just put the site in the 
    Restricted Zone but enable scripting (which, admittedly, would not be a 
    typical configuration for this zone). What results at best is null for 
    the contentWindow property. Early versions (before 9.0) throw an 
    exception just for trying to evaluate the property.  */

function GetContentWindow (Frame)
{
    var e;
    try {
        return Frame.contentWindow;
    }
    catch (e) {
        alert ("Exception while loading contentWindow:" + e);
    }
    return null;
}

Viewer.prototype.HasBannerWindow = function () 
{
    return (this.BannerWindow = GetContentWindow (this.BannerFrame)) != null;
};

Viewer.prototype.HasTocWindow = function () 
{
    return (this.TocWindow = GetContentWindow (this.TocFrame)) != null;
};

/*  Frame Query  */
/*  ===========  */
/*  Frameset     */

/*  As noted above, the viewer is three elements and everything in between. 
    The ViewerFrameset is a convenient container of these three during 
    construction.  */

function ViewerFrameset (TopRow, MainRow, DocFrame)
{
    this.TopRow = TopRow;
    this.MainRow = MainRow;
    this.DocFrame = DocFrame;

    /*  We'll insert the frameset in stages. There are things to track, 
        things it's convenient to have on hand, and things to keep in case 
        we must undo.  */

    this.Document = window.document;

    this.Html = this.Document.documentElement;
    this.HtmlId = null;

    this.Body = null;
    this.BodyId = null;

    this.TopRowInserted = false;
    this.MainRowInserted = false;
}

/*  Call during global initialisation - see ConstructViewer - to create a 
    ViewerFrameset.  */

Viewer.prototype.CreateFrameset = function ()
{
    var doc = window.document;

    /*  First, since we create several DIV nodes and two IFRAME nodes, let's 
        have some helpers. 

        Each added DIV element is created as if it had an ID attribute for 
        styling.  */

    var creatediv = function (Id) {
        var node = doc.createElement ("DIV");
        node.id = Id;
        return node;
    };

    /*  An ID for styling is also required for each IFRAME. The Hint 
        argument supplies a TITLE, which the browser may show if it does not 
        show the frame. 

        Each IFRAME needs a SRC, of course. Some folklore would have it that 
        the SRC is more efficiently set only after the IFRAME actually is in 
        a document. This is disregarded here, instead favouring the hope 
        that the earlier the browser is told which URL to use for the 
        frame's content, the earlier the browser can start the downloading.  */

    var createframe = function (Pathname, Id, Hint) {

        var node = doc.createElement ("IFRAME");

        /*  Early Internet Explorer versions are sometimes seen to create a 
            3-D border which goes away if FRAMEBORDER is zero. This 
            attribute for an IFRAME tag is said to be obsolete. It may 
            indeed be obsolete for new browsers, but of the CSS stylings 
            that are yet known to avoid a 3-D border in Internet Explorer 9 
            and higher, none work for earlier versions. */

        node.frameBorder = 0;
        node.id = Id;
        node.src = Pathname;
        node.title = Hint;
        return node;
    };

    /*  Create all the nodes that we'll build between the document's BODY 
        and its original children (when we learn of them, the BODY being yet 
        to finish loading).  */

    var ids = Config.ViewerIds;

    var toprow = creatediv (ids.TopRow);
    var mainrow = creatediv (ids.MainRow);
    var bannerdiv = creatediv (ids.BannerDiv);
    this.TocDiv = creatediv (ids.TocDiv);
    this.TocDocDiv = creatediv (ids.TocDocDiv);
    this.DocDiv = creatediv (ids.DocDiv);

    var hints = Config.FrameHints;

    var src = Config.BannerPathname;
    this.BannerFrame = createframe (src, ids.BannerFrame, hints.BannerFrame);

    src = PathAppend (GetSubwebPath (null), Config.TocFilename);
    this.TocFrame = createframe (src, ids.TocFrame, hints.TocFrame);

    this.DocFrame = creatediv (ids.DocFrame);

    /*  Now that we have all the nodes, build them into a tree under the 
        nodes that will become immediate children of the BODY.  */

    bannerdiv.appendChild (this.BannerFrame);

    toprow.appendChild (bannerdiv);

    this.TocDiv.appendChild (this.TocFrame);
    this.DocDiv.appendChild (this.DocFrame);

    mainrow.appendChild (this.TocDiv);
    mainrow.appendChild (this.TocDocDiv);
    mainrow.appendChild (this.DocDiv);

    /*  Give our caller the three nodes that the Frameset exposes to the 
        original DOM tree. The TopRow and MainRow become the only children 
        of the original BODY. The DocFrame is where the original children 
        move to.  */

    return new ViewerFrameset (toprow, mainrow, this.DocFrame);
};

/*  The viewer depends on fixed positioning for DIV elements. This is not 
    available before Internet Explorer 7 and may be disallowed by later 
    versions because of inferences about quirks mode.  */

function HasFixedPosition (Element)
{
    var style = Element.currentStyle;
    if (style == null) style = window.getComputedStyle (Element);
    return style != null && style.position == "fixed";
}

/*  To get the frameset inserted into the active DOM tree, call the Insert 
    method soon after the BODY is loaded, i.e., from a handler of the 
    window's load event. 

    Were we to do the lot in one go, then the algorithm that has the fewest 
    moves and is the fastest yet seen in tests is: first, insert the 
    viewer's new nodes, i.e., the two small trees under the TopRow and 
    MainRow, at the start of the BODY; then, move the BODY's original 
    children to the DocFrame at the end of what we inserted. 

    An alternative is to move all the BODY's original children to the 
    DocFrame (or to a document fragment) first and then hope to gain for 
    appending to an emptied BODY. The original children then move twice, 
    which shows in tests, especially if the children are numerous and have 
    deep trees of descendants. Internet Explorer has much trouble on this 
    point. But done this way the work can be broken into parts for 
    synchronising better with the browser's other work. 

    Very plausibly, more thinking and experimentation is required to find 
    the optimal algorithm. 

    Whatever we end up with, note that although the number of children to 
    move is not the dominant factor, it clearly is an important factor. 
    There would be far fewer calls to the browser if all our documents were 
    prepared with the P and similar tags of their main text in a DIV (or 
    MAIN) instead of directly in the BODY. Though the time needed is 
    certainly not determined just by the number of calls, a point of 
    procedure for the HTML authoring is worth establishing: whenever a page 
    is edited, wrap its BODY children into one DIV! */

ViewerFrameset.prototype.BeginInsert = function ()
{
    /*  The viewer's new nodes were each created with the expected ID. Set a 
        viewer ID for the pre-existing BODY and HTML nodes too.  */

    this.HtmlId = this.Html.id;
    this.Html.id = Config.ViewerIds.Html;

    this.Body = this.Document.body;
    this.BodyId = this.Body.id;
    this.Body.id = Config.ViewerIds.Body;
}

ViewerFrameset.prototype.MoveDocumentNodes = function ()
{
    /*  Remove the BODY's original children (and all their descendants). We 
        might hold them temporarily in a document fragment to move them to 
        the DocFrame separately from the DocFrame's insertion into the BODY 
        via the MainRow, but the presently favoured algorithm is to move 
        them now to their final place. 

        Either way, there's an interesting question of how to move them. 
        Getting the children as a collecction in one call to the browser 
        would ordinarily be (much) more efficient than repeatedly calling 
        the browser to learn of the children one by one. Here, however, the 
        work we do with each child changes the collection, which is not 
        without cost.  */

    var children = this.Body.childNodes;
    for (var n = children.length; n != 0; n --) {
        this.DocFrame.appendChild (children [0]);
    }
}

ViewerFrameset.prototype.InsertTopRow = function () 
{
    /*  Having moved the document nodes away, the BODY is now empty. Add the 
        TopRow. It contains the banner. Its insertion into the document lets 
        the browser create a window for the BannerFrame and even to show the 
        banner's content, including to run its scripts.  */

    this.Body.appendChild (this.TopRow);
    this.TopRowInserted = true;
}

ViewerFrameset.prototype.ConfirmTopRow = function (Viewer)
{
    /*  Though inserting the TopRow lets the browser create a window for the 
        BannerFrame, the browser need not agree (notably because of security 
        considerations). We anyway need that the TopRow actually did get 
        fixed position, which Internet Explorer 7 (and later versions in 
        their various compatibility modes) need not have got for us.  */

    return HasFixedPosition (this.TopRow) && Viewer.HasBannerWindow ();
};

ViewerFrameset.prototype.RevealTopRow = function (Hider) {
    Hider.Transfer (this.MainRow);
};

ViewerFrameset.prototype.InsertMainRow = function ()
{
    this.Body.appendChild (this.MainRow);
    this.MainRowInserted = true;
}

ViewerFrameset.prototype.ConfirmMainRow = function (Viewer)
{
    /*  Let the frameset show, but keep the document panel under 
        construction for a while yet.  */

    return HasFixedPosition (this.MainRow) && Viewer.HasTocWindow ();
};

ViewerFrameset.prototype.RevealMainRow = function (Hider) 
{
    Hider.Transfer (this.DocFrame);
};

ViewerFrameset.prototype.Undo = function (Hider)
{
    if (this.MainRowInserted) this.Body.removeChild (this.MainRow);
    if (this.TopRowInserted) this.Body.removeChild (this.TopRow);

    var children = this.DocFrame.childNodes;
    for (var n = children.length; n != 0; n --) {
        this.Body.appendChild (children [0]);
    }

    this.Body.id = this.BodyId;
    this.Html.id = this.HtmlId;

    Hider.Reveal (true);
};

/*  Frameset  */
/*  ========  */
/*  Styling   */

/*  Most styling is left to VIEWER.CSS, which we load separately from the 
    usual DOCUMENT.CSS by inserting a suitable LINK into the HEAD (see 
    above). What concerns the script is the division of the viewport's width 
    into the TOC and document panels. This is determined dynamically as we 
    start, including from the "tw" value in the URL search string, and can 
    later be changed interactively. 

    The TOC width is that of the TocDiv at the left of the MainRow. To the 
    right is the DocDiv. It has a left border for visual separation from the 
    TocDiv. For interactive resizing of the TOC, the DocDiv's left border is 
    overlaid by the TocDocDiv which can be dragged away while the user 
    chooses a new placement of all three. The essential design is that the 
    TocDiv width (or right) is always the left of the DocDiv and is also the 
    left of the TocDocDiv when no resizing is in progress.  */

/*  called only from SetInitialTocWidth, next, and from TocResizeState.End 
    in DOCUI.JS  */

Viewer.prototype.SetTocWidth = function (TocWidth)
{
    this.TocDiv.style.width = TocWidth;
    this.TocDocDiv.style.left = TocWidth;
    this.DocDiv.style.left = TocWidth;
};

/*  called only from ConstructViewer  */

Viewer.prototype.SetInitialTocWidth = function ()
{
    /*  If there's no "tw" in the URL search string, we have nothing to 
        do.  */

    var tocwidth = this.Search.Get (Config.UrlArguments.TocWidth);
    if (tocwidth == null) return;

    /*  Parse the given width as a number and units. 

        If only for now, all we do with this interpretation is impose 
        percent as the default unit (unless doing so is implausible). 

        We might sanitise other combinations of number and units, but 
        there's a good enough argument that doing so is the browser's 
        business, and there is anyway the problem that we've made it 
        difficult by acting early and anyway by hiding our construction: for 
        instance, a plausible minimum must allow for visibility of the 
        TocDocDiv, but this node has no width yet.  */

    var parts = tocwidth.match (/^(\d+)(.*)/);
    if (parts == null || parts.length < 3) return;

    if (parts [2] == "") {
        var percent = parts [1];
        if (percent < 0 || percent > 100) return;
        tocwidth = percent + "%";
    }

    this.SpecifiedTocWidth = tocwidth;

    this.SetTocWidth (tocwidth);
};

/*  ===========================  */
/*  TOC and Document Separation  */

/*  The viewer presents as three panels: a banner as the whole of the 
    TopRow; TOC and document panels sharing the MainRow from left to 
    right. 

    TO DO: 

    Might this, or much of it, better be in DOCUI.JS?  */

/*  called from TOC.JS during its global initialisation  */

Viewer.prototype.SetTocObject = function (TocObject)
{
    this.TocObject = TocObject;
};

/*  ----------------  */
/*  Persistent State  */

/*  TO DO: 

    This section does not execute until the page is being left, almost 
    always because of user interactivity, e.g., clicking on a link. Might it 
    be moved to DOCUI.JS - or is DOCUI strictly for the event handling that 
    supports the user interface?  */

/*  The following helper is self-standing in anticipation of wider use but 
    its only present use is by the LoadPersistentState method (below).  */

function ComposeTocWidth (TocWidth)
{
    /*  If the given width ends with a pecent sign, strip it.  */

    var cch = TocWidth.length;
    if (cch -- > 1 && TocWidth.charAt (cch) == "%") {
        return TocWidth.substring (0, cch);
    }
    return TocWidth;
}

/*  private to LoadPersistentState, below  */

Viewer.prototype.GetPersistentTocWidth = function (Viewer)
{
    var state = this.TocResizeState;
    if (state != null) {
        var tw = state.GetPersistentTocWidth ();
        if (tw != null) return tw;
    }
    return this.SpecifiedTocWidth;
};

/*  called only from LocalUrl.LoadPersistentState in MASTER.JS - but from 
    any frame while redirecting a local link  */

Viewer.prototype.LoadPersistentState = function (Target)
{
    /*  Most of what carry to the next page is the TOC state. Ask TOC.JS in 
        the TOC frame. We know how because TOC.JS will have given us a 
        reference to its Toc object - see next.  */

    var toc = this.TocObject;
    if (toc != null) toc.LoadPersistentState (Target);

    /*  We have a little of our own.  */

    var tw = this.GetPersistentTocWidth (this);
    if (tw != null) {
        Target.AppendSearch (
            Config.UrlArguments.TocWidth, 
            ComposeTocWidth (tw));
    }
};

/*  TOC and Document Separation  */
/*  ===========================  */
/*  External                     */

/*  There is just the one viewer. It is exposed to other scripts in other 
    windows without their having a reference to any instantiation - in some 
    sense as if the Viewer has static methods.  */

Viewer.prototype.DefineStaticMethods = function ()
{
    var viewer = this;

    Viewer.CallWhenInserted = function (Callback) {
        viewer.CallWhenInserted (Callback);
    };

    Viewer.CallWhenShowing = function (Callback) {
        viewer.CallWhenShowing (Callback);
    };

    Viewer.IsBannerWindow = function (Window) {
        return viewer.IsWindowInFrame (Window, Config.ViewerIds.BannerFrame);
    };

    Viewer.IsTocWindow = function (Window) {
        return viewer.IsWindowInFrame (Window, Config.ViewerIds.TocFrame);
    };

    /*  Temporary  */

    Viewer.LoadPersistentState = function (Target) {
        viewer.LoadPersistentState (Target);
    };

    Viewer.QueryParameter = function (Parameter) {
        return viewer.Search.Get (Parameter);
    };

    Viewer.SetTocObject = function (TocObject) {
        return viewer.SetTocObject (TocObject);
    };
};

/*  External      */
/*  ============  */
/*  Construction  */

/*  Though construction begins with our first execution, it continues across 
    event handlers and other callbacks to synchronise with what the browser 
    has yet downloaded, parsed, rendered, etc. 

    The house style is to avoid forward references. So, skip ahead to 
    ConstructViewer and then read backwards.  */

/*  -------------------------  */
/*  Construction (load Event)  */

Viewer.prototype.OnLoad = function (Frameset, Hider)
{
    /*  Now that the document has a BODY, rework its DOM tree so that the 
        viewer's frameset is immediately beneath the BODY and all the BODY's 
        original children are instead in the document pane.  */

    Frameset.BeginInsert ();
    Frameset.MoveDocumentNodes ();
    Frameset.InsertTopRow ();

    var viewer = this;
    var endinserttop = function (TickCount) {
        var ok = Frameset.ConfirmTopRow (viewer);
        if (ok) {
            Frameset.RevealTopRow (Hider);
            Frameset.InsertMainRow ();
            return true;
        }
        Frameset.Undo (Hider);
        return false;
    };
    var endinsertmain = function (TickCount) {
        var ok = Frameset.ConfirmMainRow (viewer);
        if (ok) {
            Frameset.RevealMainRow (Hider);
            return true;
        }
        Frameset.Undo (Hider);
        return false;
    };

    var reveal = function (TickCount) {
        Hider.Reveal (false);
        return true;
    };

    var callbacks = [].concat (
        endinserttop, 
        endinsertmain, 
        this.OnInserted, 
        reveal, 
        this.OnShowing);

    RequestAnimationFrames (callbacks);

    this.OnCallbacksDone ();
};

/*  ------------------------------------  */
/*  Construction (Global Initialisation)  */

/*  The chronologically first work that's specific to building the viewer... 

    The following runs as the highest-level routine in the script's initial 
    execution. It arranges for more work to be picked up at the load event.  */

function ConstructViewer ()
{
    /*  Parse the URL search string once for common benefit. Do this early 
        so that we can drop out immediately if told that the user does not 
        want to run scripts. Remember, they may be telling us this because 
        the scripts don't work!  */

    var search = new ParsedSearch (window.location.search);
    if (ConfigureNoScript (search)) return;

    /*  Most of our changes are to the BODY, but the new BODY for the viewer 
        has its own stylesheet, which we add to the HEAD. We do this 
        dynamically for two reasons. One is that we don't want to edit and 
        re-upload thousands of pages. The other is that we don't need this 
        extra stylesheet as waste when scripts don't run. 

        Since we edit the HEAD anyway, we take the opportunity to add a 
        SCRIPT for loading DOCUI.JS and to add other tags that are nice to 
        have in one way or another. 

        The HEAD must be ready now - at least as far as the SCRIPT tag that 
        got us loaded, and it is our HTML authoring practice to place SCRIPT 
        tags last.  */

    EditHead (window);

    /*  Now get to work on the construction.  */

    var viewer = new Viewer (search);

    /*  Though the BODY may yet be a long way from being parsed, let alone 
        from having a DOM tree ready for inserting the viewer's frameset, we 
        do already have window and document objects and can create all the 
        nodes of the frameset now so that they're on hand for insertion as 
        soon as the BODY is ready. 

        Among the hopes from advance preparation of the IFRAME nodes, if not 
        of the whole frameset, is that the browser can work asynchronously 
        at loading the frames' intended content. */

    var frameset = viewer.CreateFrameset ();

    /*  Apparently, we can also style these nodes before they are yet in the 
        document's DOM tree. Our interest here is the division of the 
        MainRow into the TOC and document panes. A divider between them will 
        eventually be movable through the user interface, but so that the 
        divider keeps its place across a navigation, its initial placement 
        (and thus the width or right of the TocDiv and the left of the 
        DocDiv) can be specified in the URL search string.  */

    viewer.SetInitialTocWidth ();

    /*  Expose the viewer to other scripts.  */

    viewer.DefineStaticMethods ();

    /*  When the browser does get to the BODY, any first rendering of the 
        BODY will have CLASSES, etc., that are styled in the HTML for 
        presentation without scripts. It will not only have the wrong 
        styling but be in the wrong place. We do better to show nothing for 
        a while. 

        The ConstructionHider adds UnderConstruction to the CLASS of the 
        HTML node. A rule in MASTER.CSS interprets this as a high-priority 
        display:none - in effect to hide the whole DOM tree until a call to 
        the Reveal method either removes the UnderConstruction or shifts it 
        to another node.  */

    var hider = new ConstructionHider (window);

    /*  Arrange to continue when the BODY has loaded. We can then proceed 
        with reworking its content, including to insert the frameset and 
        eventually to reveal our construction.  */

    var onload = function (Event) {
        viewer.OnLoad (frameset, hider);
    };
    RegisterEventHandler (window, "load", onload);
}

/*  Viewer                 */
/*  *********************  */
/*  Global Initialisation  */

/*  A helper just to avoid making global variables, i.e., properties of the 
    window object, from what a programmer familiar with other languages 
    might mistakenly think are local  */

function CanInitDocument ()
{
    /*  If the document is not in the top window, then something is so wrong 
        that we had better not continue. It may be that we're being hosted 
        in someone else's frame. It may be that we're in one of our own, 
        perhaps because a link in the banner or TOC has somehow been 
        followed without getting "_top" edited into its target property. 
        Whatever the cause, try to force the document into the top window 
        and hope for the best.  */

    if (window != window.top) {

        /*  The top window might not be ours to operate on!  */

        var e;
        try {
            window.top.location.replace (window.location);
        }
        catch (e) {
        }
        return false;
    }

    /*  Proceed with initialisation only if MASTER.JS is loaded and hasn't 
        noticed anything as obviously unsatisfactory. 

        Running under much too old a browser counts as unsatisfactory. 

        Less obviously counting as unsatisfactory is that we're not at a 
        recognised host. The author does not want whole pages getting 
        reproduced at other sites, even in a frame, even with attribution. 
        There's some argument for bouncing out of their page, if we can, but 
        the least that's required is that we stop our scripts from possible 
        misbehaviour for running in circumstances beyond our control.  */

    if (typeof IsMasterJsGood != "function" || !IsMasterJsGood (window)) {
        return false;
    }

    /*  Also unsatisfactory, specifically for document pages, are visits 
        from a few sites that the author disapproves of enough to have 
        prepared a written objection. If the referrer is on the "bad" list, 
        show them the objection instead of this page.  */

    var bad = LookupBadReferrer (window);
    if (bad != null) {
        window.location.replace (bad);
        return false;
    }

    return true;
}

/*  If quick checks for suitability all pass, try to re-present the document 
    in a viewer. 

    Incidentally, Internet Explorer and the Chrome-based Edge are 
    consistently observed to spend less than 10ms on this "Script evaluation" 
    or "Evaluate Script" for initial execution.  */

if (CanInitDocument ()) ConstructViewer ();

/*  ************************************************************************  *
 *        Copyright © 2007-2022. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->