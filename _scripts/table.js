<!--

/*  ************************************************************************  *
 *                                 table.js                                   *
 *  ************************************************************************  */

/*  Load this script from the HEAD of any document page that wants it. The 
    DEFER attribute is recommended. 

    Load MASTER.JS and DOCUMENT.JS first. Familiarity with both is assumed.  */

/*  TO DO: 

    Rework this script so that its objects, which are created in large 
    quantity for some pages, have methods on the prototype so that they are 
    created once for each type of object, not over and over for each 
    instance of an object.  */

/*  ************************************************************************  */
/*  Background  8/

/*  Here's a fascinating thing about the HTML, CSS and DOM standards. For 
    all the complications that plague these standards regarding tables, 
    these is no standard mapping of TD or TH cells to the visual 
    presentation of the containing TABLE as rows and columns. 

    The browser, of course, has such a map. The HTML5 Specification even 
    lays out the algorithm that browsers are to use when "Forming a table". 
    But no standards committee or browser manufacturer has arranged that 
    browsers expose the results. 

    For instance, each TD or TH has a cellIndex, but this is its 0-based 
    index among the children of the containing TR. This is also the CSS 
    reckoning of the cell's "column" as the n-th child of its TR. It is not 
    the cell's column number in the TABLE if an earlier cell on the row has 
    a COLSPAN or if an earlier cell on an earlier row has a sufficiently 
    large ROWSPAN.  */

/*  ************************************************************************  */
/*  Implementation  */

/*  A TableMapSite models whatever is at one Row and Column co-ordinate pair 
    in a table. There are two cases.

        In the simple case, the co-ordinate site is the top left of a cell 
        as represented by a TD or TH node. In a table that is a simple 
        grid, this is the only case. More generally, the cell may have a 
        width and height such that it spreads to the right or bottom to take 
        in other co-ordinate sites. 

        In a table that is not a simple grid, the co-ordinate site may be 
        space in a (container) cell somewhere towards the top left. 

    Given that a table is well-formed, we'll end up with a TableMapSite for 
    each possible combination of Row from 0 up to but not including some 
    Height and Column from 0 up to but not including some Width. 

    As each TD or TH node is encountered in an enumeration of TD or TH nodes 
    as successive children of successive TR nodes in a TABLE, we create 
    first a TableMapSite that has a Node and then more that each have null 
    for the Node but which point to some other TableMapSite as a Container. 

    Looking ahead... 

    All the TableMapSite objects for any one value of Row are held in a 
    TableMapRow. All the TableMapRow objects are held in the TableMap.  */

function TableMapSite (Row, Column, CellNode)
{
    /*  Members are directly accessible from other TableMapSite objects and 
        from other types of object defined in this script. Otherwise, they 
        might as well be local variables.  */

    this.Row = Row;
    this.Column = Column;
    this.Node = CellNode;
    this.Width = 1;
    this.Height = 1;

    this.Container = null;

    /*  Operations  */
    /*  ==========  */

    /*  Deleting a co-ordinate site - given that the table is to remain 
        well-ordered - is necessarily just one step in the deletion of the 
        whole row or column. Here, we take it that the column is being 
        deleted. The understanding is that our caller deletes from top to 
        bottom. 

        TO DO: This is very quick and dirty. Do it properly some day!  */

    this.Delete = function () {

        var site = this;

        var node = this.Node;
        if (node == null) {

            site = this.Container;
            if (site.Row != this.Row) return 0;

            node = site.Node;
        }

        if (site.Width > 1) {
            node.colSpan = -- site.Width;
        }
        else {
            node.parentNode.removeChild (node);
        }

        return site.Height;
    };
}

/*  The TableMapRow is a container of TableMapSite objects for all of the 
    table's co-ordinate sites that have the one Row co-ordinate.  */

function TableMapRow (Row, RowNode)
{
    var sites = new Array;

    this.GetSite = function (Column) {
        return sites [Column];
    };

    this.AddSiteCell = function (Column, CellNode) {
        return sites [Column] = new TableMapSite (Row, Column, CellNode);
    };

    this.AddSiteSpace = function (Column, Container) {
        var site = new TableMapSite (Row, Column);
        site.Container = Container;
        return sites [Column] = site;
    };
    
    this.DeleteSite = function (Column) {

        var site = sites [Column];
        if (site == null) return 0;

        var height = site.Delete ();
        sites.splice (Column, 1);
        return height;
    };
}

/*  The TableMapCol models a column box as known from a COL node. 
    
    It's much like a TableMapSite but for its value of the Column 
    co-ordinate over the whole range of the Row co-ordinate instead of for 
    one value of Row.  */

function TableMapCol (Column, ColNode)
{
    this.Column = Column;
    this.Node = ColNode;
    this.Width = 1;

    this.Container = null;

    /*  Operations  */
    /*  ==========  */

    this.Delete = function () {

        var col = this;

        var node = this.Node;        
        if (node == null) {
            col = this.Container;
            node = col.Node;
        }

        if (col.Width > 1) {
            node.span = -- col.Width;
        }
        else {
            node.parentNode.removeChild (node);
        }
    };
}

function ColumnMap (TableNode)
{
    var cols = new Array;

    var addcolstart = function (Column, ColNode) {
        return cols [Column] = new TableMapCol (Column, ColNode);
    };

    var addcolspace = function (Column, Container) {
        var col = new TableMapCol (Column);
        col.Container = Container;
        return cols [Column] = col;
    };

    var colnodes = TableNode.getElementsByTagName ("COL");
    var count = colnodes.length;
    var width = 0;
    for (var n = 0; n < count; n ++) {
        var colnode = colnodes [n];

        var col = addcolstart (width, colnode);
        width ++;

        var span = colnode.span;
        if (span -- > 1) {
            for (var end = width + span; width < end; width ++) {
                addcolspace (width, col);
                col.Width ++;
            }
        }
    }

    this.GetWidth = function () {
        return width;
    };

    this.DeleteCol = function (Column) {

        var col = cols [Column];
        if (col == null) return;

        col.Delete ();
        cols.splice (Column, 1);
    };
}

/*  The TableMap models the whole table, of course. That said, the code will 
    model a THEAD, TBODY or TFOOT node just as well.  */

function TableMap (TableNode)
{
    /*  Initialisation  */
    /*  ==============  */

    /*  Map the column co-ordinate as defined by COL elements among the 
        TABLE node's descendents.  */

    var colmap = new ColumnMap (TableNode);
    var width = colmap.GetWidth ();

    /*  Map the row and column co-ordinates as defined by the rows and 
        columns collections of the TABLE node.  */

    var rows = new Array;

    var ensuretablerow = function (Row, RowNode) {
        var row = rows [Row];
        if (row != null) {
            if (row.Node == null) row.Node = RowNode;
            return row;
        }
        return rows [Row] = new TableMapRow (Row, RowNode);
    };

    var height = 0;

    /*  Work downwards through the TR nodes. 

        Put aside as degenerate that a row is wholly defined by a downward 
        span from preceding rows, and the index of a TR is also the Row 
        co-ordinate (here represented as y).  */

    var rownodes = TableNode.rows;
    var rowcount = rownodes.length;
    for (var y = 0; y < rowcount; y ++) {
        var tr = rownodes [y];

        /*  Successive TR nodes are on successive rows in the co-ordinate 
            system. We therefore need a TableMapRow for it - but not 
            necessarily a new one. The row may already have some 
            representation from an earlier TR that contains a cell with a 
            sufficiently large ROWSPAN.  */

        var row = ensuretablerow (y, tr);

        height ++;

        /*  To map the row's columns, work to the right through the TR 
            node's TD and TH cells. 

            A cell node's index into the row is not in general the Column 
            co-ordinate (here represented by x). The first way this happens 
            is that an earlier TR spans downwards such that the Column is 
            already represented in the TableMapRow.  */

        var cellnodes = tr.cells;
        var cellcount = cellnodes.length;
        var x = 0;
        var icellnode = 0; 
        while (icellnode < cellcount) {
            if (row.GetSite (x) != null) {
                x ++;
                continue;
            }
            var cellnode = cellnodes [icellnode ++];

            /*  Except for downwards spans from an earlier TR, each TD or TH 
                cell starts a new column on its row. We therefore need a 
                TableMapCell for it.  */

            var site = row.AddSiteCell (x, cellnode);

            /*  If this currently enumerated cell spans downwards, be sure 
                that there's a TableMapRow for each row that it spans to. 
                Within each, create a TableMapCell for the column. There is 
                no cell at this row and column. Instead, these co-ordinates 
                are contained by the currently enumerated cell and the 
                TableMapCell is merely a reference to the container.  */

            var span = cellnode.rowSpan;
            if (span > 1) {
                var end = y + span;
                for (var i = y + 1; i < end; i ++) {
                    ensuretablerow (i).AddSiteSpace (x, site);
                    site.Height ++;
                }
                if (end > height) height = end;
            }

            x ++;

            /*  If this currently enumerated cell spans to the right, then 
                create a TableMapCell for each column. Again, there is no 
                cell, just a reference to the currently enumerated cell as 
                the container.  */

            span = cellnode.colSpan;
            if (span -- > 1) {
                for (var end = x + span; x < end; x ++) {
                    row.AddSiteSpace (x, site);
                    site.Width ++;
                }
            }
        }

        /*  Ideally, the TABLE is a rectangle on the co-ordinate system. 
            Each row extends for the same count of columns, which is then 
            the table's width. Each column extends for the same count of 
            rows, which is then the table's height. 

            Less than ideally, the HTML author may have messed up. As some 
            attempt at tolerating, take the table's width and height from 
            the smallest bounding rectangle.  */

        if (x > width) width = x;
    }
    if (rowcount > height) height = rowcount;

    /*  External Access  */
    /*  ===============  */

    this.GetWidth = function () {
        return width;
    };

    this.GetHeight = function () {
        return height;
    };

    /*  Queries  */
    /*  =======  */

    var gettablecell = function (Row, Column) {
        var tablerow = rows [Row];
        return tablerow != null ? tablerow.GetSite (Column) : null;
    };

    this.EnumerateRow = function (Row, Enumerator) {

        /*  Work along the given Row co-ordinate, enumerating each site that 
            has a node. Stop, as failure, if any Enumerator fails.  */

        for (var column = 0; column < width; column ++) {
            var tablecell = gettablecell (Row, column);
            if (tablecell == null) continue;
            var node = tablecell.Node;
            if (node == null) continue;
            if (!Enumerator (node)) return false;
        }
        return true;
    };

    this.EnumerateColumn = function (Column, Enumerator) {

        /*  Work down the given Column co-ordinate, enumerating each site 
            that has a node. Stop, as failure, if any Enumerator fails.  */

        for (var row = 0; row < height; row ++) {
            var tablecell = gettablecell (row, Column);
            if (tablecell == null) continue;
            var node = tablecell.Node;
            if (node == null) continue;
            if (!Enumerator (node)) return false;
        }
        return true;
    };

    /*  Operations  */
    /*  ==========  */

    this.DeleteColumn = function (Column) {

        for (var y = 0; y < height; y ++) {
            var row = rows [y];
            if (row == null) continue;
            var span = row.DeleteSite (Column);
            if (span -- > 1) {
                for (var end = y + span; y < end; y ++) {
                    row = rows [y];
                    if (row != null) row.DeleteSite (Column);
                }
            }
        }

        colmap.DeleteCol (Column);
    };
}

/*  ************************************************************************  *
 *        Copyright © 2021-2022. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->