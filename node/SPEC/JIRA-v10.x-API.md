# Jira Software Data Center REST API Reference

**Version:** 10.7.4

This is the reference document for the REST API and resources provided by Jira Software Data Center. The REST APIs are for developers who want to integrate Jira Data Center with other applications, and for administrators who want to script configuration interactions with Jira Data Center.

Jira Data Center is built upon the Jira platform.  As such there is a natural overlap in functionality between what is provided by Jira Data Center and what is provided by the Jira platform.  If you are after an introductory, high-level view of the Jira REST APIs, then the best place to start is the [Jira REST API home](https://developer.atlassian.com/server/jira/platform/rest-apis/).
## Using the REST API
Not familiar with the Jira Data Center REST APIs? Start with our [Guide to exploring the Jira Data Center domain model via the REST APIs](https://developer.atlassian.com/server/jira/platform/tutorials_and_guides/), which will help you get a conceptual understanding of the Jira Data Center REST APIs.

If you want instructions on how to use the REST APIs, check out the [Appendix](#appendix) at the end of this page (after the resources), where you'll find information on the following topics:
* [Structure of the REST URIs](#structure)
* [Authentication](#authentication)
* [Pagination](#pagination)
* [Expansion](#expansion)
* [Special headers](#special-headers)
* [Field input formats](#fieldformats)
### Experimental methods
Methods marked as `EXPERIMENTAL` may change without notice. We are looking for your feedback for these methods. To use experimental methods, you must set this header in your requests: `X-ExperimentalApi : true`. This indicates that you are opting into the experimental preview. Once a resource or method moves out of the experimental phase, then this header will no longer be required nor checked.


## Table of Contents

- [application-properties](#application-properties) (3 endpoints)
- [applicationrole](#applicationrole) (4 endpoints)
- [attachment](#attachment) (5 endpoints)
- [avatar](#avatar) (3 endpoints)
- [backlog](#backlog) (1 endpoints)
- [board](#board) (20 endpoints)
- [cluster](#cluster) (9 endpoints)
- [comment](#comment) (4 endpoints)
- [component](#component) (6 endpoints)
- [configuration](#configuration) (1 endpoints)
- [customFieldOption](#customfieldoption) (1 endpoints)
- [customFields](#customfields) (3 endpoints)
- [dashboard](#dashboard) (6 endpoints)
- [email-templates](#email-templates) (5 endpoints)
- [epic](#epic) (7 endpoints)
- [field](#field) (2 endpoints)
- [filter](#filter) (14 endpoints)
- [group](#group) (5 endpoints)
- [groups](#groups) (1 endpoints)
- [groupuserpicker](#groupuserpicker) (1 endpoints)
- [index](#index) (1 endpoints)
- [index-snapshot](#index-snapshot) (3 endpoints)
- [issue](#issue) (53 endpoints)
- [issueLink](#issuelink) (3 endpoints)
- [issueLinkType](#issuelinktype) (7 endpoints)
- [issuesecurityschemes](#issuesecurityschemes) (2 endpoints)
- [issuetype](#issuetype) (13 endpoints)
- [issuetypescheme](#issuetypescheme) (10 endpoints)
- [jql](#jql) (2 endpoints)
- [licenseValidator](#licensevalidator) (1 endpoints)
- [monitoring](#monitoring) (8 endpoints)
- [mypermissions](#mypermissions) (1 endpoints)
- [mypreferences](#mypreferences) (3 endpoints)
- [myself](#myself) (3 endpoints)
- [notificationscheme](#notificationscheme) (2 endpoints)
- [password](#password) (3 endpoints)
- [permissions](#permissions) (1 endpoints)
- [permissionscheme](#permissionscheme) (11 endpoints)
- [priority](#priority) (3 endpoints)
- [priorityschemes](#priorityschemes) (5 endpoints)
- [project](#project) (38 endpoints)
- [projectCategory](#projectcategory) (5 endpoints)
- [projects](#projects) (1 endpoints)
- [projectvalidate](#projectvalidate) (1 endpoints)
- [reindex](#reindex) (7 endpoints)
- [resolution](#resolution) (3 endpoints)
- [role](#role) (9 endpoints)
- [screens](#screens) (13 endpoints)
- [search](#search) (2 endpoints)
- [securitylevel](#securitylevel) (1 endpoints)
- [serverInfo](#serverinfo) (1 endpoints)
- [session](#session) (3 endpoints)
- [settings](#settings) (3 endpoints)
- [sprint](#sprint) (14 endpoints)
- [status](#status) (3 endpoints)
- [statuscategory](#statuscategory) (2 endpoints)
- [terminology](#terminology) (3 endpoints)
- [universal_avatar](#universal_avatar) (4 endpoints)
- [upgrade](#upgrade) (2 endpoints)
- [user](#user) (35 endpoints)
- [version](#version) (16 endpoints)
- [websudo](#websudo) (1 endpoints)
- [workflow](#workflow) (1 endpoints)
- [workflowscheme](#workflowscheme) (26 endpoints)
- [worklog](#worklog) (3 endpoints)

---

## application-properties

### GET /api/2/application-properties

**Get an application property by key**

Returns an application property.

**Parameters:**

- **Query:** `permissionLevel` (string) - **required**
- **Query:** `keyFilter` (string) - optional
- **Query:** `key` (string) - **required**

---

### GET /api/2/application-properties/advanced-settings

**Get all advanced settings properties**

Returns the properties that are displayed on the "General Configuration > Advanced Settings" page.

*No parameters*

---

### PUT /api/2/application-properties/{id}

**Update an application property**

Update an application property via PUT. The "value" field present in the PUT will override the existing value.

**Parameters:**

- **Path:** `id` (string) - **required**

---

## applicationrole

### GET /api/2/applicationrole

**Get all application roles in the system**

Returns all application roles in the system.

*No parameters*

---

### PUT /api/2/applicationrole

**Update application roles**

Updates the ApplicationRoles with the passed data if the version hash is the same as the server. Only the groups and default groups setting of the role may be updated. Requests to change the key or the name of the role will be silently ignored. It is acceptable to pass only the roles that are updated as roles that are present in the server but not in data to update with, will not be deleted.

**Parameters:**

- **Header:** `If-Match` (string) - optional
- **Body:** `ApplicationRoleBean` - optional

---

### GET /api/2/applicationrole/{key}

**Get application role by key**

Returns the ApplicationRole with passed key if it exists.

**Parameters:**

- **Path:** `key` (string) - **required**

---

### PUT /api/2/applicationrole/{key}

**Update application role**

Updates the ApplicationRole with the passed data. Only the groups and default groups setting of the role may be updated. Requests to change the key or the name of the role will be silently ignored.

**Parameters:**

- **Path:** `key` (string) - **required**
- **Header:** `If-Match` (string) - optional
- **Header:** `versionHash` (string) - optional
- **Body:** `ApplicationRoleBean` - optional

---

## attachment

### GET /api/2/attachment/meta

**Get attachment capabilities**

Returns the meta information for an attachments, specifically if they are enabled and the maximum upload size allowed.

*No parameters*

---

### GET /api/2/attachment/{id}

**Get the meta-data for an attachment, including the URI of the actual attached file**

Returns the meta-data for an attachment, including the URI of the actual attached file.

**Parameters:**

- **Path:** `id` (string) - **required**

---

### DELETE /api/2/attachment/{id}

**Delete an attachment from an issue**

Remove an attachment from an issue.

**Parameters:**

- **Path:** `id` (string) - **required**

---

### GET /api/2/attachment/{id}/expand/human

**Get human-readable attachment expansion**

Tries to expand an attachment. Output is human-readable and subject to change.

**Parameters:**

- **Path:** `id` (string) - **required**

---

### GET /api/2/attachment/{id}/expand/raw

**Get raw attachment expansion**

Tries to expand an attachment. Output is raw and should be backwards-compatible through the course of time.

**Parameters:**

- **Path:** `id` (string) - **required**

---

## avatar

### GET /api/2/avatar/{type}/system

**Get all system avatars**

Returns all system avatars of the given type.

**Parameters:**

- **Path:** `type` (string) - **required**

---

### POST /api/2/avatar/{type}/temporary

**Create temporary avatar**

Creates temporary avatar

**Parameters:**

- **Path:** `type` (string) - **required**
- **Query:** `filename` (string) - optional
- **Query:** `size` (string) - optional

---

### POST /api/2/avatar/{type}/temporaryCrop

**Update avatar cropping**

Updates the cropping instructions of the temporary avatar

**Parameters:**

- **Path:** `type` (string) - **required**
- **Body:** `AvatarCroppingBean` - optional

---

## backlog

### POST /agile/1.0/backlog/issue

**Update issues to move them to the backlog**

Move issues to the backlog. This operation is equivalent to remove future and active sprints from a given set of issues. At most 50 issues may be moved at once.

**Parameters:**

- **Body:** `IssueAssignRequestBean` - **required**

---

## board

### GET /agile/1.0/board

**Get all boards**

Returns all boards. This only includes boards that the user has permission to view.

**Parameters:**

- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `name` (string) - optional
- **Query:** `projectKeyOrId` (string) - optional
- **Query:** `type` (StringList) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### POST /agile/1.0/board

**Create a new board**

Creates a new board. Board name, type and filter Id is required.
- name - Must be less than 255 characters.
- type - Valid values: scrum, kanban
- filterId - Id of a filter that the user has permissions to view. Note, if the user does not have the 'Create shared objects' permission and tries to create a shared board, a private board will be created instead (remember that board sharing depends on the filter sharing).
Note:
- If you want to create a new project with an associated board, use the JIRA platform REST API. For more information, see the Create project method. The projectTypeKey for software boards must be 'software' and the projectTemplateKey must be either com.pyxis.greenhopper.jira:gh-kanban-template or com.pyxis.greenhopper.jira:gh-scrum-template.
- You can create a filter using the JIRA REST API. For more information, see the Create filter method.
- If you do not ORDER BY the Rank field for the filter of your board, you will not be able to reorder issues on the board.

**Parameters:**

- **Body:** `BoardCreateBean` - **required**

---

### GET /agile/1.0/board/{boardId}

**Get a single board**

Returns a single board, for a given board Id.

**Parameters:**

- **Path:** `boardId` (integer (int64)) - **required**

---

### DELETE /agile/1.0/board/{boardId}

**Delete the board**

Deletes the board.

**Parameters:**

- **Path:** `boardId` (integer (int64)) - **required**

---

### GET /agile/1.0/board/{boardId}/backlog

**Get all issues from the board's backlog**

Returns all issues from a board's backlog, for a given board Id.

**Parameters:**

- **Path:** `boardId` (integer (int64)) - **required**
- **Query:** `expand` (string) - optional
- **Query:** `jql` (string) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `validateQuery` (boolean) - optional
- **Query:** `fields` (array) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### GET /agile/1.0/board/{boardId}/configuration

**Get the board configuration**

Get the board configuration.
The response contains the following fields:
- id - Id of the board.
- name - Name of the board.
- filter - Reference to the filter used by the given board.
- subQuery (Kanban only) - JQL subquery used by the given board.
- columnConfig - The column configuration lists the columns for the board, in the order defined in the column configuration.
For each column, it shows the issue status mapping
as well as the constraint type (Valid values: none, issueCount, issueCountExclSubs) for the min/max number of issues.
Note, the last column with statuses mapped to it is treated as the "Done" column,
which means that issues in that column will be marked as already completed.
- estimation (Scrum only) - Contains information about type of estimation used for the board. Valid values: none, issueCount, field.
If the estimation type is "field", the Id and display name of the field used for estimation is also returned.
Note, estimates for an issue can be updated by a PUT /rest/api/2/issue/{issueIdOrKey} request, however the fields must be on the screen.
"timeoriginalestimate" field will never be on the screen, so in order to update it "originalEstimate" in "timetracking" field should be updated.
- ranking - Contains information about custom field used for ranking in the given board.

**Parameters:**

- **Path:** `boardId` (integer (int64)) - **required**

---

### GET /agile/1.0/board/{boardId}/epic

**Get all epics from the board**

Returns all epics from the board, for the given board Id. This only includes epics that the user has permission to view. Note, if the user does not have permission to view the board, no epics will be returned at all.

**Parameters:**

- **Path:** `boardId` (integer (int64)) - **required**
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `done` (string) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### GET /agile/1.0/board/{boardId}/epic/none/issue

**Get all issues without an epic**

Returns all issues that do not belong to any epic on a board, for a given board Id.

**Parameters:**

- **Path:** `boardId` (integer (int64)) - **required**
- **Query:** `expand` (string) - optional
- **Query:** `jql` (string) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `validateQuery` (boolean) - optional
- **Query:** `fields` (array) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### GET /agile/1.0/board/{boardId}/epic/{epicId}/issue

**Get all issues for a specific epic**

Returns all issues that belong to an epic on the board, for the given epic Id and the board Id.

**Parameters:**

- **Path:** `epicId` (integer (int64)) - **required**
- **Path:** `boardId` (integer (int64)) - **required**
- **Query:** `expand` (string) - optional
- **Query:** `jql` (string) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `validateQuery` (boolean) - optional
- **Query:** `fields` (array) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### GET /agile/1.0/board/{boardId}/issue

**Get all issues from a board**

Returns all issues from a board, for a given board Id. This only includes issues that the user has permission to view. Note, if the user does not have permission to view the board, no issues will be returned at all. Issues returned from this resource include Agile fields, like sprint, closedSprints, flagged, and epic. By default, the returned issues are ordered by rank.

**Parameters:**

- **Path:** `boardId` (integer (int64)) - **required**
- **Query:** `expand` (string) - optional
- **Query:** `jql` (string) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `validateQuery` (boolean) - optional
- **Query:** `fields` (array) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### GET /agile/1.0/board/{boardId}/project

**Get all projects associated with the board**

Returns all projects that are associated with the board, for the given board Id. A project is associated with a board only if the board filter explicitly filters issues by the project and guaranties that all issues will come for one of those projects e.g. board's filter with "project in (PR-1, PR-1) OR reporter = admin" jql Projects are returned only if user can browse all projects that are associated with the board. Note, if the user does not have permission to view the board, no projects will be returned at all. Returned projects are ordered by the name.

**Parameters:**

- **Path:** `boardId` (integer (int64)) - **required**
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### GET /agile/1.0/board/{boardId}/properties

**Get all properties keys for a board**

Returns the keys of all properties for the board identified by the id. The user who retrieves the property keys is required to have permissions to view the board.

**Parameters:**

- **Path:** `boardId` (string) - **required**

---

### GET /agile/1.0/board/{boardId}/properties/{propertyKey}

**Get a property from a board**

Returns the value of the property with a given key from the board identified by the provided id. The user who retrieves the property is required to have permissions to view the board.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `boardId` (string) - **required**

---

### PUT /agile/1.0/board/{boardId}/properties/{propertyKey}

**Update a board's property**

Sets the value of the specified board's property. You can use this resource to store a custom data against the board identified by the id. The user who stores the data is required to have permissions to modify the board.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `boardId` (string) - **required**

---

### DELETE /agile/1.0/board/{boardId}/properties/{propertyKey}

**Delete a property from a board**

Removes the property from the board identified by the id. Ths user removing the property is required to have permissions to modify the board.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `boardId` (string) - **required**

---

### GET /agile/1.0/board/{boardId}/settings/refined-velocity

**Get the value of the refined velocity setting**

Returns the value of the setting for refined velocity chart

**Parameters:**

- **Path:** `boardId` (integer (int64)) - **required**

---

### PUT /agile/1.0/board/{boardId}/settings/refined-velocity

**Update the board's refined velocity setting**

Sets the value of the specified board's refined velocity setting.

**Parameters:**

- **Path:** `boardId` (integer (int64)) - **required**
- **Body:** `BooleanSettingBean` - **required**

---

### GET /agile/1.0/board/{boardId}/sprint

**Get all sprints from a board**

Returns all sprints from a board, for a given board Id. This only includes sprints that the user has permission to view.

**Parameters:**

- **Path:** `boardId` (integer (int64)) - **required**
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `state` (StringList) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### GET /agile/1.0/board/{boardId}/sprint/{sprintId}/issue

**Get all issues for a sprint**

Get all issues you have access to that belong to the sprint from the board. Issue returned from this resource contains additional fields like: sprint, closedSprints, flagged and epic. Issues are returned ordered by rank. JQL order has higher priority than default rank.

**Parameters:**

- **Path:** `sprintId` (integer (int64)) - **required**
- **Path:** `boardId` (integer (int64)) - **required**
- **Query:** `expand` (string) - optional
- **Query:** `jql` (string) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `validateQuery` (boolean) - optional
- **Query:** `fields` (array) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### GET /agile/1.0/board/{boardId}/version

**Get all versions from a board**

Returns all versions from a board, for a given board Id. This only includes versions that the user has permission to view. Note, if the user does not have permission to view the board, no versions will be returned at all. Returned versions are ordered by the name of the project from which they belong and then by sequence defined by user.

**Parameters:**

- **Path:** `boardId` (integer (int64)) - **required**
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `released` (string) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

## cluster

### PUT /api/2/cluster/index-snapshot/{nodeId}

**Request node index snapshot**

Request current index from node (the request is processed asynchronously). This method is deprecated as it is Lucene specific and is planned for removal in Jira 11.

**Parameters:**

- **Path:** `nodeId` (string) - **required**

---

### DELETE /api/2/cluster/node/{nodeId}

**Delete a cluster node**

Delete the node from the cluster if state of node is OFFLINE.

**Parameters:**

- **Path:** `nodeId` (string) - **required**

---

### PUT /api/2/cluster/node/{nodeId}/offline

**Update node state to offline**

Change the node's state to offline if the node is reporting as active, but is not alive.

**Parameters:**

- **Path:** `nodeId` (string) - **required**

---

### GET /api/2/cluster/nodes

**Get all cluster nodes**

Returns all nodes in cluster.

*No parameters*

---

### POST /api/2/cluster/zdu/approve

**Approve cluster upgrade**

Approves the cluster upgrade.

*No parameters*

---

### POST /api/2/cluster/zdu/cancel

**Cancel cluster upgrade**

Cancels the ongoing cluster upgrade.

*No parameters*

---

### POST /api/2/cluster/zdu/retryUpgrade

**Retry cluster upgrade**

Retries the cluster upgrade.

*No parameters*

---

### POST /api/2/cluster/zdu/start

**Start cluster upgrade**

Starts the cluster upgrade.

*No parameters*

---

### GET /api/2/cluster/zdu/state

**Get cluster upgrade state**

Returns the current state of the cluster upgrade.

*No parameters*

---

## comment

### GET /api/2/comment/{commentId}/properties

**Get properties keys of a comment**

Returns the keys of all properties for the comment identified by the key or by the id.

**Parameters:**

- **Path:** `commentId` (string) - **required**

---

### GET /api/2/comment/{commentId}/properties/{propertyKey}

**Get a property from a comment**

Returns the value of the property with a given key from the comment identified by the key or by the id. The user who retrieves the property is required to have permissions to read the comment.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `commentId` (string) - **required**

---

### PUT /api/2/comment/{commentId}/properties/{propertyKey}

**Set a property on a comment**

Sets the value of the specified comment's property.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `commentId` (string) - **required**
- **Body:** `object` - optional

---

### DELETE /api/2/comment/{commentId}/properties/{propertyKey}

**Delete a property from a comment**

Removes the property from the comment identified by the key or by the id. Ths user removing the property is required to have permissions to administer the comment.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `commentId` (string) - **required**

---

## component

### POST /api/2/component

**Create component**

Create a component via POST.

**Parameters:**

- **Body:** `ComponentBean` - optional

---

### GET /api/2/component/page

**Get paginated components**

Returns paginated list of filtered active components

**Parameters:**

- **Query:** `maxResults` (string) - optional
- **Query:** `query` (string) - optional
- **Query:** `projectIds` (string) - optional
- **Query:** `startAt` (string) - optional

---

### GET /api/2/component/{id}

**Get project component**

Returns a project component.

**Parameters:**

- **Path:** `id` (string) - **required**

---

### PUT /api/2/component/{id}

**Update a component**

Modify a component via PUT. Any fields present in the PUT will override existing values. As a convenience, if a field is not present, it is silently ignored.

**Parameters:**

- **Path:** `id` (string) - **required**
- **Body:** `ComponentBean` - optional

---

### DELETE /api/2/component/{id}

**Delete a project component**

Delete a project component.

**Parameters:**

- **Path:** `id` (string) - **required**
- **Query:** `moveIssuesTo` (string) - optional

---

### GET /api/2/component/{id}/relatedIssueCounts

**Get component related issues**

Returns counts of issues related to this component.

**Parameters:**

- **Path:** `id` (string) - **required**

---

## configuration

### GET /api/2/configuration

**Get Jira configuration details**

Returns the information if the optional features in Jira are enabled or disabled. If the time tracking is enabled, it also returns the detailed information about time tracking configuration.

*No parameters*

---

## customFieldOption

### GET /api/2/customFieldOption/{id}

**Get custom field option by ID**

Returns a full representation of the Custom Field Option that has the given id.

**Parameters:**

- **Path:** `id` (string) - **required**

---

## customFields

### GET /api/2/customFields

**Get custom fields with pagination**

Returns a list of Custom Fields in the given range.

**Parameters:**

- **Query:** `sortColumn` (string) - optional
- **Query:** `types` (string) - optional
- **Query:** `search` (string) - optional
- **Query:** `maxResults` (string) - optional
- **Query:** `sortOrder` (string) - optional
- **Query:** `screenIds` (string) - optional
- **Query:** `lastValueUpdate` (string) - optional
- **Query:** `projectIds` (string) - optional
- **Query:** `startAt` (string) - optional

---

### DELETE /api/2/customFields

**Delete custom fields in bulk**

Deletes custom fields in bulk.

**Parameters:**

- **Query:** `ids` (string) - **required**

---

### GET /api/2/customFields/{customFieldId}/options

**Get custom field options**

Returns custom field's options defined in a given context composed of projects and issue types.

**Parameters:**

- **Path:** `customFieldId` (string) - **required**
- **Query:** `maxResults` (string) - optional
- **Query:** `issueTypeIds` (string) - optional
- **Query:** `query` (string) - optional
- **Query:** `sortByOptionName` (string) - optional
- **Query:** `useAllContexts` (string) - optional
- **Query:** `page` (string) - optional
- **Query:** `projectIds` (string) - optional

---

## dashboard

### GET /api/2/dashboard

**Get all dashboards with optional filtering**

Returns a list of all dashboards, optionally filtering them.

**Parameters:**

- **Query:** `filter` (string) - optional
- **Query:** `maxResults` (string) - optional
- **Query:** `startAt` (string) - optional

---

### GET /api/2/dashboard/{dashboardId}/items/{itemId}/properties

**Get all properties keys for a dashboard item**

Returns the keys of all properties for the dashboard item identified by the id.

**Parameters:**

- **Path:** `itemId` (string) - **required**
- **Path:** `dashboardId` (string) - **required**

---

### GET /api/2/dashboard/{dashboardId}/items/{itemId}/properties/{propertyKey}

**Get a property from a dashboard item**

Returns the value of the property with a given key from the dashboard item identified by the id.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `itemId` (string) - **required**
- **Path:** `dashboardId` (string) - **required**

---

### PUT /api/2/dashboard/{dashboardId}/items/{itemId}/properties/{propertyKey}

**Set a property on a dashboard item**

Sets the value of the property with a given key on the dashboard item identified by the id.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `itemId` (string) - **required**
- **Path:** `dashboardId` (string) - **required**

---

### DELETE /api/2/dashboard/{dashboardId}/items/{itemId}/properties/{propertyKey}

**Delete a property from a dashboard item**

Removes the property from the dashboard item identified by the key or by the id.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `itemId` (string) - **required**
- **Path:** `dashboardId` (string) - **required**

---

### GET /api/2/dashboard/{id}

**Get a single dashboard by ID**

Returns a single dashboard.

**Parameters:**

- **Path:** `id` (string) - **required**

---

## email-templates

### GET /api/2/email-templates

**Get email templates as zip file**

Creates a zip file containing email templates at local home and returns the file.

*No parameters*

---

### POST /api/2/email-templates

**Update email templates with zip file**

Extracts given zip file to temporary templates folder. If the folder already exists it will replace it's content

**Parameters:**

- **Body:** `object` - optional

---

### POST /api/2/email-templates/apply

**Update email templates with previously uploaded pack**

Replaces the current email templates pack with previously uploaded one, if exists.

*No parameters*

---

### POST /api/2/email-templates/revert

**Update email templates to default**

Replaces the current email templates pack with default templates, which are copied over from Jira binaries.

*No parameters*

---

### GET /api/2/email-templates/types

**Get email types for templates**

Returns a list of root templates mapped with Event Types. The list can be used to decide which test emails to send.

*No parameters*

---

## epic

### GET /agile/1.0/epic/none/issue

**Get issues without an epic**

Returns all issues that do not belong to any epic. This only includes issues that the user has permission to view. Issues returned from this resource include Agile fields, like sprint, closedSprints, flagged, and epic. By default, the returned issues are ordered by rank.

**Parameters:**

- **Query:** `expand` (string) - optional
- **Query:** `jql` (string) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `validateQuery` (boolean) - optional
- **Query:** `fields` (array) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### POST /agile/1.0/epic/none/issue

**Remove issues from any epic**

Removes issues from epics. The user needs to have the edit issue permission for all issue they want to remove from epics. The maximum number of issues that can be moved in one operation is 50.

**Parameters:**

- **Body:** `IssueAssignRequestBean` - **required**

---

### GET /agile/1.0/epic/{epicIdOrKey}

**Get an epic by id or key**

Returns the epic for a given epic Id. This epic will only be returned if the user has permission to view it.

**Parameters:**

- **Path:** `epicIdOrKey` (string) - **required**

---

### POST /agile/1.0/epic/{epicIdOrKey}

**Update an epic's details**

Performs a partial update of the epic. A partial update means that fields not present in the request JSON will not be updated. Valid values for color are color_1 to color_9.

**Parameters:**

- **Path:** `epicIdOrKey` (string) - **required**
- **Body:** `EpicUpdateBean` - **required**

---

### GET /agile/1.0/epic/{epicIdOrKey}/issue

**Get issues for a specific epic**

Returns all issues that belong to the epic, for the given epic Id. This only includes issues that the user has permission to view. Issues returned from this resource include Agile fields, like sprint, closedSprints, flagged, and epic. By default, the returned issues are ordered by rank.

**Parameters:**

- **Path:** `epicIdOrKey` (string) - **required**
- **Query:** `expand` (string) - optional
- **Query:** `jql` (string) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `validateQuery` (boolean) - optional
- **Query:** `fields` (array) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### POST /agile/1.0/epic/{epicIdOrKey}/issue

**Move issues to a specific epic**

Moves issues to an epic, for a given epic id. Issues can be only in a single epic at the same time. That means that already assigned issues to an epic, will not be assigned to the previous epic anymore. The user needs to have the edit issue permission for all issue they want to move and to the epic. The maximum number of issues that can be moved in one operation is 50.

**Parameters:**

- **Path:** `epicIdOrKey` (string) - **required**
- **Body:** `IssueAssignRequestBean` - **required**

---

### PUT /agile/1.0/epic/{epicIdOrKey}/rank

**Rank an epic relative to another**

Moves (ranks) an epic before or after a given epic. If rankCustomFieldId is not defined, the default rank field will be used.

**Parameters:**

- **Path:** `epicIdOrKey` (string) - **required**
- **Body:** `EpicRankRequestBean` - **required**

---

## field

### GET /api/2/field

**Get all fields, both System and Custom**

Returns a list of all fields, both System and Custom

*No parameters*

---

### POST /api/2/field

**Create a custom field using a definition**

Creates a custom field using a definition

**Parameters:**

- **Body:** `CustomFieldDefinitionJsonBean` - optional

---

## filter

### POST /api/2/filter

**Create a new filter**

Creates a new filter, and returns newly created filter. Currently sets permissions just using the users default sharing permissions

**Parameters:**

- **Query:** `expand` (StringList) - optional
- **Body:** `FilterBean` - optional

---

### GET /api/2/filter/defaultShareScope

**Get default share scope**

Returns the default share scope of the logged-in user

*No parameters*

---

### PUT /api/2/filter/defaultShareScope

**Set default share scope**

Sets the default share scope of the logged-in user. Available values are: AUTHENTICATED (for sharing with all logged-in users) and PRIVATE (for no shares).

**Parameters:**

- **Body:** `DefaultShareScopeBean` - optional

---

### GET /api/2/filter/favourite

**Get favourite filters**

Returns the favourite filters of the logged-in user

**Parameters:**

- **Query:** `expand` (StringList) - optional

---

### GET /api/2/filter/{id}

**Get a filter by ID**

Returns a filter given an id

**Parameters:**

- **Path:** `id` (string) - **required**
- **Query:** `expand` (StringList) - optional

---

### PUT /api/2/filter/{id}

**Update an existing filter**

Updates an existing filter, and returns its new value. The following properties of a filter can be updated: 'jql', 'name', 'description'. Additionally, administrators can also update the 'owner' field. To get, set or unset 'favourite', use rest/api/1.0/filters/{id}/favourite with GET, PUT and DELETE methods instead.

**Parameters:**

- **Path:** `id` (string) - **required**
- **Query:** `expand` (StringList) - optional
- **Body:** `FilterBean` - optional

---

### DELETE /api/2/filter/{id}

**Delete a filter**

**Parameters:**

- **Path:** `id` (string) - **required**

---

### GET /api/2/filter/{id}/columns

**Get default columns for filter**

Returns the default columns for the given filter. Currently logged in user will be used as the user making such request.

**Parameters:**

- **Path:** `id` (string) - **required**

---

### PUT /api/2/filter/{id}/columns

**Set default columns for filter**

Sets the default columns for the given filter

**Parameters:**

- **Path:** `id` (string) - **required**
- **Body:** `object` - optional

---

### DELETE /api/2/filter/{id}/columns

**Reset columns for filter**

Resets the columns for the given filter such that the filter no longer has its own column config

**Parameters:**

- **Path:** `id` (string) - **required**

---

### GET /api/2/filter/{id}/permission

**Get all share permissions of filter**

Returns all share permissions of the given filter

**Parameters:**

- **Path:** `id` (string) - **required**

---

### POST /api/2/filter/{id}/permission

**Add share permissions to filter**

Adds a share permissions to the given filter. Adding a global permission removes all previous permissions from the filter

**Parameters:**

- **Path:** `id` (string) - **required**
- **Body:** `SharePermissionInputBean` - optional

---

### DELETE /api/2/filter/{id}/permission/{permission-id}

**Remove share permissions from filter**

Removes a share permissions from the given filter

**Parameters:**

- **Path:** `permissionId` (string) - **required**
- **Path:** `id` (string) - **required**
- **Path:** `permission-id` (integer (int64)) - **required**

---

### GET /api/2/filter/{id}/permission/{permissionId}

**Get a single share permission of filter**

Returns a single share permission of the given filter

**Parameters:**

- **Path:** `permissionId` (string) - **required**
- **Path:** `id` (string) - **required**

---

## group

### POST /api/2/group

**Create a group with given parameters**

Creates a group by given group parameter

**Parameters:**

- **Body:** `AddGroupBean` - optional

---

### DELETE /api/2/group

**Delete a specified group**

Deletes a group by given group parameter

**Parameters:**

- **Query:** `groupname` (string) - **required**
- **Query:** `swapGroup` (string) - optional

---

### GET /api/2/group/member

**Get users from a specified group**

Returns a paginated list of users who are members of the specified group and its subgroups

**Parameters:**

- **Query:** `includeInactiveUsers` (string) - optional
- **Query:** `maxResults` (string) - optional
- **Query:** `groupname` (string) - **required**
- **Query:** `startAt` (string) - optional

---

### POST /api/2/group/user

**Add a user to a specified group**

Adds given user to a group

**Parameters:**

- **Query:** `groupname` (string) - **required**
- **Body:** `UpdateUserToGroupBean` - optional

---

### DELETE /api/2/group/user

**Remove a user from a specified group**

Removes given user from a group

**Parameters:**

- **Query:** `groupname` (string) - **required**
- **Query:** `username` (string) - **required**

---

## groups

### GET /api/2/groups/picker

**Get groups matching a query**

Returns groups with substrings matching a given query

**Parameters:**

- **Query:** `maxResults` (string) - optional
- **Query:** `query` (string) - optional
- **Query:** `exclude` (string) - optional
- **Query:** `userName` (string) - optional

---

## groupuserpicker

### GET /api/2/groupuserpicker

**Get users and groups matching query with highlighting**

Returns a list of users and groups matching query with highlighting

**Parameters:**

- **Query:** `issueTypeId` (string) - optional
- **Query:** `maxResults` (string) - optional
- **Query:** `query` (string) - optional
- **Query:** `showAvatar` (string) - optional
- **Query:** `projectId` (string) - optional
- **Query:** `fieldId` (string) - optional

---

## index

### GET /api/2/index/summary

**Get index condition summary**

Returns a summary of the index condition of the current node.
The returned data consists of:
- `nodeId` - Node identifier.
- `reportTime` - Time of this report creation.
- `issueIndex` - Summary of the issue index status.
- `replicationQueues` - Map of index replication queues, where keys represent nodes from which replication operations came from.

`issueIndex` can contain:
    - `indexReadable` - If `false` the endpoint failed to read data from the issue index (check Jira logs for detailed stack trace), otherwise `true`.
    - `countInDatabase` - Count of issues found in the database.
    - `countInIndex` - Count of issues found while querying the index.
    - `lastUpdatedInDatabase` - Time of the last update of the issue found in the database.
    - `lastUpdatedInIndex` - Time of the last update of the issue found while querying the index.
`replicationQueues`'s map values can contain:
    - `lastConsumedOperation` - Last executed index replication operation by the current node from the sending node's queue.
    - `lastConsumedOperation.id` - Identifier of the operation.
    - `lastConsumedOperation.replicationTime` - Time when the operation was sent to other nodes.
    - `lastOperationInQueue` - Last index replication operation in the sending node's queue.
    - `lastOperationInQueue.id` - Identifier of the operation.
    - `lastOperationInQueue.replicationTime` - Time when the operation was sent to other nodes.
    - `queueSize` - Number of operations in the queue from the sending node to the current node.

*No parameters*

---

## index-snapshot

### GET /api/2/index-snapshot

**Get list of available index snapshots**

Lists available index snapshots absolute paths with timestamps

*No parameters*

---

### POST /api/2/index-snapshot

**Create index snapshot if not in progress**

Starts taking an index snapshot if no other snapshot creation process is in progress

*No parameters*

---

### GET /api/2/index-snapshot/isRunning

**Get index snapshot creation status**

Checks if index snapshot creation is currently running

*No parameters*

---

## issue

### PUT /agile/1.0/issue/rank

**Rank issues before or after a given issue**

Moves (ranks) issues before or after a given issue. At most 50 issues may be ranked at once. This operation may fail for some issues, although this will be rare. In that case the 207 status code is returned for the whole response and detailed information regarding each issue is available in the response body. If rankCustomFieldId is not defined, the default rank field will be used.

**Parameters:**

- **Body:** `IssueRankRequestBean` - **required**

---

### GET /agile/1.0/issue/{issueIdOrKey}

**Get a single issue with Agile fields**

Returns a single issue, for a given issue Id or issue key. Issues returned from this resource include Agile fields, like sprint, closedSprints, flagged, and epic.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `expand` (string) - optional
- **Query:** `fields` (array) - optional
- **Query:** `updateHistory` (boolean) - optional

---

### GET /agile/1.0/issue/{issueIdOrKey}/estimation

**Get the estimation of an issue for a board**

Returns the estimation of the issue and a fieldId of the field that is used for it.
Original time internally stores and returns the estimation as a number of seconds.
The field used for estimation on the given board can be obtained from board configuration resource.
More information about the field are returned by edit meta resource or field resource.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `boardId` (integer (int64)) - optional

---

### PUT /agile/1.0/issue/{issueIdOrKey}/estimation

**Update the estimation of an issue for a board**

Updates the estimation of the issue. boardId param is required. This param determines which field will be updated on a issue.
Note that this resource changes the estimation field of the issue regardless of appearance the field on the screen.
Original time tracking estimation field accepts estimation in formats like "1w", "2d", "3h", "20m" or number which represent number of minutes.
However, internally the field stores and returns the estimation as a number of seconds.
The field used for estimation on the given board can be obtained from <a href="#agile/1.0/board-getConfiguration">board configuration resource</a>.
More information about the field are returned by edit meta resource or field resource.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `boardId` (integer (int64)) - optional
- **Body:** `FieldEditBean` - **required**

---

### POST /api/2/issue

**Create an issue or sub-task from json**

Creates an issue or a sub-task from a JSON representation.
The fields that can be set on create, in either the fields parameter or the update parameter can be determined using the /rest/api/2/issue/createmeta resource.
If a field is not configured to appear on the create screen, then it will not be in the createmeta, and a field
validation error will occur if it is submitted.
Creating a sub-task is similar to creating a regular issue, with two important differences:
- the issueType field must correspond to a sub-task issue type (you can use /issue/createmeta to discover sub-task issue types), and
- you must provide a parent field in the issue create request containing the id or key of the parent issue.
The updateHistory param adds the project that this issue is created in, to the current user's project history, if set to true (by default, the project history is not updated).
You can view the project history in the Jira application, via the Projects dropdown.

**Parameters:**

- **Query:** `updateHistory` (boolean) - optional
- **Body:** `IssueUpdateBean` - optional

---

### POST /api/2/issue/archive

**Archive list of issues**

Archives a list of issues.

**Parameters:**

- **Query:** `notifyUsers` (string) - optional
- **Body:** `object` - optional

---

### POST /api/2/issue/bulk

**Create an issue or sub-task from json - bulk operation.**

Creates issues or sub-tasks from a JSON representation. Creates many issues in one bulk operation.
Creating a sub-task is similar to creating a regular issue. More details can be found in createIssue section.

**Parameters:**

- **Body:** `IssuesUpdateBean` - optional

---

### GET /api/2/issue/createmeta/{projectIdOrKey}/issuetypes

**Get metadata for project issue types**

Returns the metadata for issue types used for creating issues. Data will not be returned if the user does not have permission to create issues in that project.

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**
- **Query:** `maxResults` (string) - optional
- **Query:** `startAt` (string) - optional

---

### GET /api/2/issue/createmeta/{projectIdOrKey}/issuetypes/{issueTypeId}

**Get metadata for issue types used for creating issues**

Returns the metadata for issue types used for creating issues. Data will not be returned if the user does not have permission to create issues in that project.

**Parameters:**

- **Path:** `issueTypeId` (string) - **required**
- **Path:** `projectIdOrKey` (string) - **required**
- **Query:** `maxResults` (string) - optional
- **Query:** `startAt` (string) - optional

---

### GET /api/2/issue/picker

**Get suggested issues for auto-completion**

Get issue picker resource

**Parameters:**

- **Query:** `currentProjectId` (string) - optional
- **Query:** `query` (string) - optional
- **Query:** `currentIssueKey` (string) - optional
- **Query:** `showSubTasks` (string) - optional
- **Query:** `currentJQL` (string) - optional
- **Query:** `showSubTaskParent` (string) - optional

---

### POST /api/2/issue/remotelink/reciprocal

**Create reciprocal remote issue link**

Create reciprocal remote issue link from a JSON representation. Jira will create two issue links, source -> target and target -> source.

**Parameters:**

- **Body:** `RemoteReciprocalIssueLinkCreateRequest` - optional

---

### GET /api/2/issue/{issueIdOrKey}

**Get issue for key**

Returns a full representation of the issue for the given issue key.
An issue JSON consists of the issue key, a collection of fields,
a link to the workflow transition sub-resource, and (optionally) the HTML rendered values of any fields that support it
(e.g. if wiki syntax is enabled for the description or comments).
The fields param (which can be specified multiple times) gives a comma-separated list of fields
to include in the response. This can be used to retrieve a subset of fields.
A particular field can be excluded by prefixing it with a minus.
By default, all (*all) fields are returned in this get-issue resource. Note: the default is different
when doing a jql search -- the default there is just navigable fields (*navigable).
- *all - include all fields
- *navigable - include just navigable fields
- summary,comment - include just the summary and comments
- -comment - include everything except comments (the default is *all for get-issue)
- *all,-comment - include everything except comments

The {@code properties} param is similar to {@code fields} and specifies a comma-separated list of issue
properties to include. Unlike {@code fields}, properties are not included by default. To include them all
send {@code ?properties=*all}. You can also include only specified properties or exclude some properties
with a minus (-) sign.

- {@code *all} - include all properties
- {@code *all, -prop1} - include all properties except {@code prop1}
- {@code prop1, prop1} - include {@code prop1} and {@code prop2} properties

Jira will attempt to identify the issue by the issueIdOrKey path parameter. This can be an issue id,
or an issue key. If the issue cannot be found via an exact match, Jira will also look for the issue in a case-insensitive way,
by looking to see if the issue was moved. In either of these cases, the request will proceed as normal (a 302 or other redirect
will not be returned). The issue key contained in the response will indicate the current value of issue's key.

The expand param is used to include, hidden by default, parts of response. This can be used to include:

- renderedFields - field values in HTML format
- names - display name of each field
- schema - schema for each field which describes a type of the field
- transitions - all possible transitions for the given issue
- operations - all possibles operations which may be applied on issue
- editmeta - information about how each field may be edited. It contains field's schema as well.
- changelog - history of all changes of the given issue
- versionedRepresentations -
REST representations of all fields. Some field may contain more recent versions. RESET representations are numbered.
The greatest number always represents the most recent version. It is recommended that the most recent version is used.
version for these fields which provide a more recent REST representation.
After including versionedRepresentations "fields" field become hidden.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `expand` (string) - optional
- **Query:** `fields` (string) - optional
- **Query:** `updateHistory` (string) - optional
- **Query:** `properties` (string) - optional

---

### PUT /api/2/issue/{issueIdOrKey}

**Edit an issue from a JSON representation**

Edits an issue from a JSON representation. The issue can either be updated by setting explicit the field value(s) or by using an operation to change the field value.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `notifyUsers` (string) - optional
- **Body:** `IssueUpdateBean` - optional

---

### DELETE /api/2/issue/{issueIdOrKey}

**Delete an issue**

Deletes an issue. If the issue has subtasks you must set the parameter deleteSubtasks=true to delete the issue. You cannot delete an issue without its subtasks also being deleted.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `deleteSubtasks` (string) - optional

---

### PUT /api/2/issue/{issueIdOrKey}/archive

**Archive an issue**

Archives an issue.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `notifyUsers` (string) - optional

---

### PUT /api/2/issue/{issueIdOrKey}/assignee

**Assign an issue to a user**

Assign an issue to a user.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Body:** `UserBean` - optional

---

### POST /api/2/issue/{issueIdOrKey}/attachments

**Add one or more attachments to an issue**

Add one or more attachments to an issue.
This resource expects a multipart post. The media-type multipart/form-data is defined in RFC 1867. Most client libraries have classes that make dealing with multipart posts simple. For instance, in Java the Apache HTTP Components library provides a MultiPartEntity that makes it simple to submit a multipart POST.
In order to protect against XSRF attacks, because this method accepts multipart/form-data, it has XSRF protection
on it. This means you must submit a header of X-Atlassian-Token: no-check with the request, otherwise it will be blocked.
The name of the multipart/form-data parameter that contains attachments must be file.
A simple example to upload a file called "myfile.txt" to issue TEST-123:
curl -D- -u admin:admin -X POST -H "X-Atlassian-Token: no-check" -F "file=@myfile.txt" http://myhost/rest/api/2/issue/TEST-123/attachments

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Body:** `object` - optional

---

### GET /api/2/issue/{issueIdOrKey}/comment

**Get comments for an issue**

Returns all comments for an issue. Results can be ordered by the 'created' field which means the date a comment was added.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `expand` (string) - optional
- **Query:** `maxResults` (string) - optional
- **Query:** `orderBy` (string) - optional
- **Query:** `startAt` (string) - optional

---

### POST /api/2/issue/{issueIdOrKey}/comment

**Add a comment**

Adds a new comment to an issue.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `expand` (string) - optional
- **Body:** `CommentJsonBean` - optional

---

### GET /api/2/issue/{issueIdOrKey}/comment/{id}

**Get a comment by id**

Returns a single comment.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Path:** `id` (string) - **required**
- **Query:** `expand` (string) - optional

---

### PUT /api/2/issue/{issueIdOrKey}/comment/{id}

**Update a comment**

Updates an existing comment using its JSON representation.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Path:** `id` (string) - **required**
- **Query:** `expand` (string) - optional
- **Body:** `CommentJsonBean` - optional

---

### DELETE /api/2/issue/{issueIdOrKey}/comment/{id}

**Delete a comment**

Deletes an existing comment.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Path:** `id` (string) - **required**

---

### PUT /api/2/issue/{issueIdOrKey}/comment/{id}/pin

**Pin a comment**

Pins a comment to the top of the comment list.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Path:** `id` (string) - **required**
- **Body:** `boolean` - **required**

---

### GET /api/2/issue/{issueIdOrKey}/editmeta

**Get metadata for issue types used for editing issues**

Returns the meta data for editing an issue. The fields in the editmeta correspond to the fields in the edit screen for the issue. Fields not in the screen will not be in the editmeta.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**

---

### POST /api/2/issue/{issueIdOrKey}/notify

**Send notification to recipients**

Sends a notification (email) to the list or recipients defined in the request.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Body:** `NotificationJsonBean` - optional

---

### GET /api/2/issue/{issueIdOrKey}/pinned-comments

**Get pinned comments for an issue**

Returns all pinned to the issue comments.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**

---

### GET /api/2/issue/{issueIdOrKey}/properties

**Get keys of all properties for an issue**

Returns the keys of all properties for the issue identified by the key or by the id.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**

---

### GET /api/2/issue/{issueIdOrKey}/properties/{propertyKey}

**Get the value of a specific property from an issue**

Returns the value of the property with a given key from the issue identified by the key or by the id.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `issueIdOrKey` (string) - **required**

---

### PUT /api/2/issue/{issueIdOrKey}/properties/{propertyKey}

**Update the value of a specific issue's property**

Sets the value of the specified issue's property.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `issueIdOrKey` (string) - **required**
- **Body:** `string (json)` - **required**

---

### DELETE /api/2/issue/{issueIdOrKey}/properties/{propertyKey}

**Delete a property from an issue**

Removes the property from the issue identified by the key or by the id.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `issueIdOrKey` (string) - **required**

---

### GET /api/2/issue/{issueIdOrKey}/remotelink

**Get remote issue links for an issue**

Get remote issue links for an issue.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `globalId` (string) - optional

---

### POST /api/2/issue/{issueIdOrKey}/remotelink

**Create or update remote issue link**

Creates or updates a remote issue link from a JSON representation. If a globalId is provided and a remote issue link exists with that globalId, the remote issue link is updated. Otherwise, the remote issue link is created.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Body:** `RemoteIssueLinkCreateOrUpdateRequest` - optional

---

### DELETE /api/2/issue/{issueIdOrKey}/remotelink

**Delete remote issue link**

Delete the remote issue link with the given global id on the issue.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `globalId` (string) - **required**

---

### GET /api/2/issue/{issueIdOrKey}/remotelink/{linkId}

**Get a remote issue link by its id**

Get a remote issue link by its id.

**Parameters:**

- **Path:** `linkId` (string) - **required**
- **Path:** `issueIdOrKey` (string) - **required**

---

### PUT /api/2/issue/{issueIdOrKey}/remotelink/{linkId}

**Update remote issue link**

Updates a remote issue link from a JSON representation. Any fields not provided are set to null.

**Parameters:**

- **Path:** `linkId` (string) - **required**
- **Path:** `issueIdOrKey` (string) - **required**
- **Body:** `RemoteIssueLinkCreateOrUpdateRequest` - optional

---

### DELETE /api/2/issue/{issueIdOrKey}/remotelink/{linkId}

**Delete remote issue link by id**

Delete the remote issue link with the given id on the issue.

**Parameters:**

- **Path:** `linkId` (string) - **required**
- **Path:** `issueIdOrKey` (string) - **required**

---

### PUT /api/2/issue/{issueIdOrKey}/restore

**Restore an archived issue**

Restores an archived issue.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `notifyUsers` (string) - optional

---

### GET /api/2/issue/{issueIdOrKey}/subtask

**Get an issue's subtask list**

Returns an issue's subtask list

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**

---

### GET /api/2/issue/{issueIdOrKey}/subtask/move

**Check if a subtask can be moved**

Checks if a subtask can be moved

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**

---

### POST /api/2/issue/{issueIdOrKey}/subtask/move

**Reorder an issue's subtasks**

Reorders an issue's subtasks by moving the subtask at index 'from' to index 'to'.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Body:** `IssueSubTaskMovePositionBean` - **required**

---

### GET /api/2/issue/{issueIdOrKey}/transitions

**Get list of transitions possible for an issue**

Get a list of the transitions possible for this issue by the current user, along with fields that are required and their types.
Fields will only be returned if `expand=transitions.fields`.
The fields in the metadata correspond to the fields in the transition screen for that transition.
Fields not in the screen will not be in the metadata.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `transitionId` (string) - optional

---

### POST /api/2/issue/{issueIdOrKey}/transitions

**Perform a transition on an issue**

Perform a transition on an issue.
When performing the transition you can update or set other issue fields.
The fields that can be set on transition, in either the fields parameter or the update parameter can be determined using the /rest/api/2/issue/{issueIdOrKey}/transitions?expand=transitions.fields resource.
If a field is not configured to appear on the transition screen, then it will not be in the transition metadata, and a field validation error will occur if it is submitted.
The updateHistory param adds the issues retrieved by this method to the current user's issue history, if set to true (by default, the issue history does not include issues retrieved via the REST API).
You can view the issue history in the Jira application, via the Issues dropdown or by using the lastViewed JQL field in an issue search.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Body:** `IssueUpdateBean` - optional

---

### GET /api/2/issue/{issueIdOrKey}/votes

**Get votes for issue**

A REST sub-resource representing the voters on the issue.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**

---

### POST /api/2/issue/{issueIdOrKey}/votes

**Add vote to issue**

Adds voter (currently logged user) to particular ticket. You need to be logged in to use this method.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**

---

### DELETE /api/2/issue/{issueIdOrKey}/votes

**Remove vote from issue**

Remove your vote from an issue.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**

---

### GET /api/2/issue/{issueIdOrKey}/watchers

**Get list of watchers of issue**

Returns the list of watchers for the issue with the given key.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**

---

### POST /api/2/issue/{issueIdOrKey}/watchers

**Add a user as watcher**

Adds a user to an issue's watcher list.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `userName` (string) - optional
- **Body:** `string` - optional

---

### DELETE /api/2/issue/{issueIdOrKey}/watchers

**Delete watcher from issue**

Removes a user from an issue's watcher list.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `userName` (string) - optional
- **Query:** `username` (string) - optional

---

### GET /api/2/issue/{issueIdOrKey}/worklog

**Get worklogs for an issue**

Returns all work logs for an issue. Work logs won't be returned if the Log work field is hidden for the project.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**

---

### POST /api/2/issue/{issueIdOrKey}/worklog

**Add a worklog entry**

Adds a new worklog entry to an issue.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Query:** `newEstimate` (string) - optional
- **Query:** `adjustEstimate` (string) - optional
- **Query:** `reduceBy` (string) - optional
- **Body:** `worklog` - optional

---

### GET /api/2/issue/{issueIdOrKey}/worklog/{id}

**Get a worklog by id**

Returns a specific worklog. The work log won't be returned if the Log work field is hidden for the project.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Path:** `id` (string) - **required**

---

### PUT /api/2/issue/{issueIdOrKey}/worklog/{id}

**Update a worklog entry**

Updates an existing worklog entry. Note that:
- Fields possible for editing are: comment, visibility, started, timeSpent and timeSpentSeconds.
- Either timeSpent or timeSpentSeconds can be set.
- Fields which are not set will not be updated.
- For a request to be valid, it has to have at least one field change.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Path:** `id` (string) - **required**
- **Query:** `newEstimate` (string) - optional
- **Query:** `adjustEstimate` (string) - optional
- **Body:** `worklog` - optional

---

### DELETE /api/2/issue/{issueIdOrKey}/worklog/{id}

**Delete a worklog entry**

Deletes an existing worklog entry.

**Parameters:**

- **Path:** `issueIdOrKey` (string) - **required**
- **Path:** `id` (string) - **required**
- **Query:** `newEstimate` (string) - optional
- **Query:** `adjustEstimate` (string) - optional
- **Query:** `increaseBy` (string) - optional

---

## issueLink

### POST /api/2/issueLink

**Create an issue link between two issues**

Creates an issue link between two issues.

**Parameters:**

- **Body:** `LinkIssueRequestJsonBean` - **required**

---

### GET /api/2/issueLink/{linkId}

**Get an issue link with the specified id**

Returns an issue link with the specified id.

**Parameters:**

- **Path:** `linkId` (string) - **required**

---

### DELETE /api/2/issueLink/{linkId}

**Delete an issue link with the specified id**

Deletes an issue link with the specified id.

**Parameters:**

- **Path:** `linkId` (string) - **required**

---

## issueLinkType

### GET /api/2/issueLinkType

**Get list of available issue link types**

Returns a list of available issue link types, if issue linking is enabled.

*No parameters*

---

### POST /api/2/issueLinkType

**Create a new issue link type**

Create a new issue link type.

**Parameters:**

- **Body:** `IssueLinkTypeJsonBean` - **required**

---

### PUT /api/2/issueLinkType/order

**Reset the order of issue link types alphabetically.**

Resets the order of issue link types alphabetically.

**Parameters:**

- **Body:** `IssueLinkTypeResetOrderRequest` - **required**

---

### GET /api/2/issueLinkType/{issueLinkTypeId}

**Get information about an issue link type**

Returns for a given issue link type id all information about this issue link type.

**Parameters:**

- **Path:** `issueLinkTypeId` (string) - **required**

---

### PUT /api/2/issueLinkType/{issueLinkTypeId}

**Update the specified issue link type**

Update the specified issue link type.

**Parameters:**

- **Path:** `issueLinkTypeId` (string) - **required**
- **Body:** `IssueLinkTypeJsonBean` - **required**

---

### DELETE /api/2/issueLinkType/{issueLinkTypeId}

**Delete the specified issue link type**

Delete the specified issue link type.

**Parameters:**

- **Path:** `issueLinkTypeId` (string) - **required**

---

### PUT /api/2/issueLinkType/{issueLinkTypeId}/order

**Update the order of the issue link type.**

Moves the issue link type to a new position within the list.

**Parameters:**

- **Path:** `issueLinkTypeId` (string) - **required**
- **Body:** `IssueLinkTypeOrderUpdateRequest` - **required**

---

## issuesecurityschemes

### GET /api/2/issuesecurityschemes

**Get all issue security schemes**

Returns all issue security schemes that are defined.

*No parameters*

---

### GET /api/2/issuesecurityschemes/{id}

**Get specific issue security scheme by id**

Returns the issue security scheme along with that are defined.

**Parameters:**

- **Path:** `id` (string) - **required**

---

## issuetype

### GET /api/2/issuetype

**Get list of all issue types visible to user**

Returns a list of all issue types visible to the user

*No parameters*

---

### POST /api/2/issuetype

**Create an issue type from JSON representation**

Creates an issue type from a JSON representation and adds the issue newly created issue type to the default issue type scheme.

**Parameters:**

- **Body:** `IssueTypeCreateBean` - **required**

---

### GET /api/2/issuetype/page

**Get paginated list of filtered issue types**

Returns paginated list of filtered issue types

**Parameters:**

- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `query` (string) - optional
- **Query:** `projectIds` (array) - optional
- **Query:** `startAt` (integer (int64)) - optional
- **Header:** `X-Requested-With` (string) - optional

---

### GET /api/2/issuetype/{id}

**Get full representation of issue type by id**

Returns a full representation of the issue type that has the given id.

**Parameters:**

- **Path:** `id` (string) - **required**

---

### PUT /api/2/issuetype/{id}

**Update specified issue type from JSON representation**

Updates the specified issue type from a JSON representation.

**Parameters:**

- **Path:** `id` (string) - **required**
- **Body:** `IssueTypeUpdateBean` - **required**

---

### DELETE /api/2/issuetype/{id}

**Delete specified issue type and migrate associated issues**

Deletes the specified issue type. If the issue type has any associated issues, these issues will be migrated to the alternative issue type specified in the parameter.

**Parameters:**

- **Path:** `id` (string) - **required**
- **Path:** `alternativeIssueTypeId` (string) - **required**

---

### GET /api/2/issuetype/{id}/alternatives

**Get list of alternative issue types for given id**

Returns a list of all alternative issue types for the given issue type id.

**Parameters:**

- **Path:** `id` (string) - **required**

---

### POST /api/2/issuetype/{id}/avatar

**Convert temporary avatar into a real avatar**

Converts temporary avatar into a real avatar

**Parameters:**

- **Path:** `id` (string) - **required**
- **Body:** `AvatarCroppingBean` - **required**

---

### POST /api/2/issuetype/{id}/avatar/temporary

**Create temporary avatar using multipart for issue type**

Creates temporary avatar using multipart. The response is sent back as JSON stored in a textarea. This is because
the client uses remote iframing to submit avatars using multipart. So we must send them a valid HTML page back from
which the client parses the JSON from.
Creating a temporary avatar is part of a 3-step process in uploading a new
avatar for an issue type: upload, crop, confirm. This endpoint allows you to use a multipart upload
instead of sending the image directly as the request body.
You *must* use "avatar" as the name of the upload parameter:
curl -c cookiejar.txt -X POST -u admin:admin -H "X-Atlassian-Token: no-check" \
  -F "avatar=@mynewavatar.png;type=image/png" \
  'http://localhost:8090/jira/rest/api/2/issuetype/1/avatar/temporary'

**Parameters:**

- **Path:** `id` (string) - **required**
- **Body:** `object` - optional

---

### GET /api/2/issuetype/{issueTypeId}/properties

**Get all properties keys for issue type**

Returns the keys of all properties for the issue type identified by the id

**Parameters:**

- **Path:** `issueTypeId` (string) - **required**

---

### GET /api/2/issuetype/{issueTypeId}/properties/{propertyKey}

**Get value of specified issue type's property**

Returns the value of the property with a given key from the issue type identified by the id

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `issueTypeId` (string) - **required**

---

### PUT /api/2/issuetype/{issueTypeId}/properties/{propertyKey}

**Update specified issue type's property**

Sets the value of the specified issue type's property

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `issueTypeId` (string) - **required**
- **Body:** `PropertyBean` - **required**

---

### DELETE /api/2/issuetype/{issueTypeId}/properties/{propertyKey}

**Delete specified issue type's property**

Removes the property from the issue type identified by the id

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `issueTypeId` (string) - **required**

---

## issuetypescheme

### GET /api/2/issuetypescheme

**Get list of all issue type schemes visible to user**

Returns a list of all issue type schemes visible to the user. All issue types associated with the scheme will only be returned if an additional query parameter is provided: expand=schemes.issueTypes. Similarly, the default issue type associated with the scheme (if one exists) will only be returned if an additional query parameter is provided: expand=schemes.defaultIssueType. Note that both query parameters can be used together: expand=schemes.issueTypes,schemes.defaultIssueType.

*No parameters*

---

### POST /api/2/issuetypescheme

**Create an issue type scheme from JSON representation**

Creates an issue type scheme from a JSON representation

**Parameters:**

- **Body:** `IssueTypeSchemeCreateUpdateBean` - **required**

---

### GET /api/2/issuetypescheme/{schemeId}

**Get full representation of issue type scheme by id**

Returns a full representation of the issue type scheme that has the given id

**Parameters:**

- **Path:** `schemeId` (string) - **required**

---

### PUT /api/2/issuetypescheme/{schemeId}

**Update specified issue type scheme from JSON representation**

Updates the specified issue type scheme from a JSON representation

**Parameters:**

- **Path:** `schemeId` (string) - **required**
- **Body:** `IssueTypeSchemeCreateUpdateBean` - **required**

---

### DELETE /api/2/issuetypescheme/{schemeId}

**Delete specified issue type scheme**

Deletes the specified issue type scheme. Any projects associated with this IssueTypeScheme will be automatically associated with the global default IssueTypeScheme.

**Parameters:**

- **Path:** `schemeId` (string) - **required**

---

### GET /api/2/issuetypescheme/{schemeId}/associations

**Get all of the associated projects for specified scheme**

For the specified issue type scheme, returns all of the associated projects

**Parameters:**

- **Path:** `schemeId` (string) - **required**
- **Query:** `expand` (string) - optional

---

### POST /api/2/issuetypescheme/{schemeId}/associations

**Add project associations to scheme**

Adds additional projects to those already associated with the specified issue type scheme

**Parameters:**

- **Path:** `schemeId` (string) - **required**
- **Body:** `AssociateProjectsBean` - **required**

---

### PUT /api/2/issuetypescheme/{schemeId}/associations

**Set project associations for scheme**

Associates the given projects with the specified issue type scheme

**Parameters:**

- **Path:** `schemeId` (string) - **required**
- **Body:** `AssociateProjectsBean` - **required**

---

### DELETE /api/2/issuetypescheme/{schemeId}/associations

**Remove all project associations for specified scheme**

Removes all project associations for the specified issue type scheme

**Parameters:**

- **Path:** `schemeId` (string) - **required**

---

### DELETE /api/2/issuetypescheme/{schemeId}/associations/{projIdOrKey}

**Remove given project association for specified scheme**

For the specified issue type scheme, removes the given project association

**Parameters:**

- **Path:** `projIdOrKey` (string) - **required**
- **Path:** `schemeId` (string) - **required**

---

## jql

### GET /api/2/jql/autocompletedata

**Get auto complete data for JQL searches**

Returns the auto complete data required for JQL searches

*No parameters*

---

### GET /api/2/jql/autocompletedata/suggestions

**Get auto complete suggestions for JQL search**

Returns auto complete suggestions for JQL search

**Parameters:**

- **Query:** `predicateValue` (string) - optional
- **Query:** `predicateName` (string) - optional
- **Query:** `fieldName` (string) - optional
- **Query:** `fieldValue` (string) - optional

---

## licenseValidator

### POST /api/2/licenseValidator

**Validate a Jira license**

Validates a Jira license

**Parameters:**

- **Body:** `string` - **required**

---

## monitoring

### GET /api/2/monitoring/app

**Get App Monitoring status**

Checks if App Monitoring is enabled

*No parameters*

---

### POST /api/2/monitoring/app

**Update App Monitoring status**

Enables or disables App Monitoring

**Parameters:**

- **Body:** `AppMonitoringRestEntity` - **required**

---

### GET /api/2/monitoring/ipd

**Get if IPD Monitoring is enabled**

Checks if IPD Monitoring is enabled

*No parameters*

---

### POST /api/2/monitoring/ipd

**Update IPD Monitoring status**

Enables or disables IPD Monitoring

**Parameters:**

- **Body:** `IpdMonitoringRestEntity` - **required**

---

### GET /api/2/monitoring/jmx/areMetricsExposed

**Check if JMX metrics are being exposed**

Checks if JMX metrics are being exposed

*No parameters*

---

### GET /api/2/monitoring/jmx/getAvailableMetrics

**Get the available JMX metrics**

Gets the available JMX metrics

*No parameters*

---

### POST /api/2/monitoring/jmx/startExposing

**Start exposing JMX metrics**

Starts exposing JMX metrics

*No parameters*

---

### POST /api/2/monitoring/jmx/stopExposing

**Stop exposing JMX metrics**

Stops exposing JMX metrics

*No parameters*

---

## mypermissions

### GET /api/2/mypermissions

**Get permissions for the logged in user**

Returns all permissions in the system and whether the currently logged in user has them. You can optionally provide a specific context to get permissions for (projectKey OR projectId OR issueKey OR issueId)

**Parameters:**

- **Query:** `issueId` (string) - optional
- **Query:** `projectKey` (string) - optional
- **Query:** `issueKey` (string) - optional
- **Query:** `projectId` (string) - optional

---

## mypreferences

### GET /api/2/mypreferences

**Get user preference by key**

Returns preference of the currently logged in user. Preference key must be provided as input parameter (key). The value is returned exactly as it is. If key parameter is not provided or wrong - status code 404. If value is found  - status code 200.

**Parameters:**

- **Query:** `key` (string) - optional

---

### PUT /api/2/mypreferences

**Update user preference**

Sets preference of the currently logged in user. Preference key must be provided as input parameters (key). Value must be provided as post body. If key or value parameter is not provided - status code 404. If preference is set - status code 204.

**Parameters:**

- **Query:** `key` (string) - optional
- **Body:** `string` - optional

---

### DELETE /api/2/mypreferences

**Delete user preference**

Removes preference of the currently logged in user. Preference key must be provided as input parameters (key). If key parameter is not provided or wrong - status code 404. If preference is unset - status code 204.

**Parameters:**

- **Query:** `key` (string) - optional

---

## myself

### GET /api/2/myself

**Get currently logged user**

Returns currently logged user. This resource cannot be accessed anonymously

*No parameters*

---

### PUT /api/2/myself

**Update currently logged user**

Modify currently logged user. The 'value' fields present will override the existing value. Fields skipped in request will not be changed. Only email and display name can be change that way. Requires user password.

**Parameters:**

- **Body:** `UserWriteBean` - **required**

---

### PUT /api/2/myself/password

**Update caller password**

Modify caller password.

**Parameters:**

- **Body:** `PasswordBean` - **required**

---

## notificationscheme

### GET /api/2/notificationscheme

**Get paginated notification schemes**

Returns a paginated list of notification schemes. In order to access notification scheme, the calling user is
required to have permissions to administer at least one project associated with the requested notification scheme. Each scheme contains
a list of events and recipient configured to receive notifications for these events. Consumer should allow events without recipients to appear in response.
The list is ordered by the scheme's name.
Follow the documentation of /notificationscheme/{id} resource for all details about returned value.


**Parameters:**

- **Query:** `expand` (string) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### GET /api/2/notificationscheme/{id}

**Get full notification scheme details**

Returns a full representation of the notification scheme for the given id. This resource will return a
notification scheme containing a list of events and recipient configured to receive notifications for these events. Consumer
should allow events without recipients to appear in response. User accessing
the data is required to have permissions to administer at least one project associated with the requested notification scheme.
Notification recipients can be:
- current assignee - the value of the notificationType is CurrentAssignee
- issue reporter - the value of the notificationType is Reporter
- current user - the value of the notificationType is CurrentUser
- project lead - the value of the notificationType is ProjectLead
- component lead - the value of the notificationType is ComponentLead
- all watchers - the value of the notification type is AllWatchers
<li>configured user - the value of the notification type is User. Parameter will contain key of the user. Information about the user will be provided
if <b>user</b> expand parameter is used.
- configured group - the value of the notification type is Group. Parameter will contain name of the group. Information about the group will be provided
if <b>group</b> expand parameter is used.
- configured email address - the value of the notification type is EmailAddress, additionally information about the email will be provided.
- users or users in groups in the configured custom fields - the value of the notification type is UserCustomField or GroupCustomField. Parameter
will contain id of the custom field. Information about the field will be provided if <b>field</b> expand parameter is used.
- configured project role - the value of the notification type is ProjectRole. Parameter will contain project role id. Information about the project role
will be provided if <b>projectRole</b> expand parameter is used.
Please see the example for reference.
The events can be Jira system events or events configured by administrator. In case of the system events, data about theirs
ids, names and descriptions is provided. In case of custom events, the template event is included as well.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Query:** `expand` (string) - optional

---

## password

### GET /api/2/password/policy

**Get current password policy requirements**

Returns the list of requirements for the current password policy. For example, "The password must have at least 10 characters.", "The password must not be similar to the user's name or email address.", etc.

**Parameters:**

- **Query:** `hasOldPassword` (boolean) - optional

---

### POST /api/2/password/policy/createUser

**Get reasons for password policy disallowance on user creation**

Returns a list of statements explaining why the password policy would disallow a proposed password for a new user.
You can use this method to test the password policy validation. This could be done prior to an action
where a new user and related password are created, using methods like the ones in
<a href="https://docs.atlassian.com/jira/latest/com/atlassian/jira/bc/user/UserService.html">UserService</a>.
For example, you could use this to validate a password in a create user form in the user interface, as the user enters it.
The username and new password must be not empty to perform the validation.
Note, this method will help you validate against the policy only. It won't check any other validations that might be performed
when creating a new user, e.g. checking whether a user with the same name already exists.


**Parameters:**

- **Body:** `PasswordPolicyCreateUserBean` - **required**

---

### POST /api/2/password/policy/updateUser

**Get reasons for password policy disallowance on user password update**

Returns a list of statements explaining why the password policy would disallow a proposed new password for a user with an existing password.
You can use this method to test the password policy validation. This could be done prior to an action where the password
is actually updated, using methods like ChangePassword or ResetPassword.
For example, you could use this to validate a password in a change password form in the user interface, as the user enters it.
The user must exist and the username and new password must be not empty, to perform the validation.
Note, this method will help you validate against the policy only. It won't check any other validations that might be performed
when submitting a password change/reset request, e.g. verifying whether the old password is valid.


**Parameters:**

- **Body:** `PasswordPolicyUpdateUserBean` - **required**

---

## permissions

### GET /api/2/permissions

**Get all permissions present in Jira instance**

Returns all permissions that are present in the Jira instance - Global, Project and the global ones added by plugins

*No parameters*

---

## permissionscheme

### GET /api/2/permissionscheme

**Get all permission schemes**

Returns a list of all permission schemes. By default only shortened beans are returned. If you want to include permissions of all the schemes, then specify the permissions expand parameter. Permissions will be included also if you specify any other expand parameter.

**Parameters:**

- **Query:** `expand` (string) - optional

---

### POST /api/2/permissionscheme

**Create a new permission scheme**

Create a new permission scheme. This method can create schemes with a defined permission set, or without.

**Parameters:**

- **Query:** `expand` (string) - optional
- **Body:** `PermissionSchemeBean` - optional

---

### GET /api/2/permissionscheme/{permissionSchemeId}/attribute/{attributeKey}

**Get scheme attribute by key**

Returns the attribute for a permission scheme specified by permission scheme id and attribute key.

**Parameters:**

- **Path:** `permissionSchemeId` (integer (int64)) - **required**
- **Path:** `attributeKey` (string) - **required**

---

### PUT /api/2/permissionscheme/{permissionSchemeId}/attribute/{key}

**Update or insert a scheme attribute**

Updates or inserts the attribute for a permission scheme specified by permission scheme id. The attribute consists of the key and the value. The value will be converted to Boolean using Boolean#valueOf.

**Parameters:**

- **Path:** `permissionSchemeId` (integer (int64)) - **required**
- **Path:** `key` (string) - **required**
- **Body:** `object` - optional

---

### GET /api/2/permissionscheme/{schemeId}

**Get a permission scheme by ID**

Returns a permission scheme identified by the given id.

**Parameters:**

- **Path:** `schemeId` (integer (int64)) - **required**
- **Query:** `expand` (string) - optional

---

### PUT /api/2/permissionscheme/{schemeId}

**Update a permission scheme**

Updates a permission scheme. If the permissions list is present then it will be set in the permission scheme, which basically means it will overwrite any permission grants that existed in the permission scheme. Sending an empty list will remove all permission grants from the permission scheme. To update just the name and description, do not send permissions list at all. To add or remove a single permission grant instead of updating the whole list at once use the {schemeId}/permission/ resource.

**Parameters:**

- **Path:** `schemeId` (integer (int64)) - **required**
- **Query:** `expand` (string) - optional
- **Body:** `PermissionSchemeBean` - optional

---

### DELETE /api/2/permissionscheme/{schemeId}

**Delete a permission scheme by ID**

Deletes a permission scheme identified by the given id.

**Parameters:**

- **Path:** `schemeId` (integer (int64)) - **required**

---

### GET /api/2/permissionscheme/{schemeId}/permission

**Get all permission grants of a scheme**

Returns all permission grants of the given permission scheme.

**Parameters:**

- **Path:** `schemeId` (integer (int64)) - **required**
- **Query:** `expand` (string) - optional

---

### POST /api/2/permissionscheme/{schemeId}/permission

**Create a permission grant in a scheme**

Creates a permission grant in a permission scheme.

**Parameters:**

- **Path:** `schemeId` (integer (int64)) - **required**
- **Query:** `expand` (string) - optional
- **Body:** `PermissionGrantBean` - optional

---

### GET /api/2/permissionscheme/{schemeId}/permission/{permissionId}

**Get a permission grant by ID**

Returns a permission grant identified by the given id.

**Parameters:**

- **Path:** `permissionId` (integer (int64)) - **required**
- **Path:** `schemeId` (integer (int64)) - **required**
- **Query:** `expand` (string) - optional

---

### DELETE /api/2/permissionscheme/{schemeId}/permission/{permissionId}

**Delete a permission grant from a scheme**

Deletes a permission grant from a permission scheme.

**Parameters:**

- **Path:** `permissionId` (integer (int64)) - **required**
- **Path:** `schemeId` (integer (int64)) - **required**

---

## priority

### GET /api/2/priority

**Get all issue priorities**

Returns a list of all issue priorities

*No parameters*

---

### GET /api/2/priority/page

**Get paginated issue priorities**

Returns a page with list of issue priorities whose names (or their translations) match query

**Parameters:**

- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `query` (string) - optional
- **Query:** `projectIds` (array) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### GET /api/2/priority/{id}

**Get an issue priority by ID**

Returns an issue priority

**Parameters:**

- **Path:** `id` (string) - **required**

---

## priorityschemes

### GET /api/2/priorityschemes

**Get all priority schemes**

Returns all priority schemes. All project keys associated with the priority scheme will only be returned if additional query parameter is provided <code>expand=schemes.projectKeys</code>

**Parameters:**

- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### POST /api/2/priorityschemes

**Create new priority scheme**

Creates new priority scheme.

**Parameters:**

- **Body:** `PrioritySchemeUpdateBean` - **required**

---

### GET /api/2/priorityschemes/{schemeId}

**Get a priority scheme by ID**

Gets a full representation of a priority scheme in JSON format.

**Parameters:**

- **Path:** `schemeId` (integer (int64)) - **required**

---

### PUT /api/2/priorityschemes/{schemeId}

**Update a priority scheme**

Updates a priority scheme. Update will be rejected if issue migration would be needed as a result of scheme update. Priority scheme update with migration is possible from the UI.

**Parameters:**

- **Path:** `schemeId` (integer (int64)) - **required**
- **Body:** `PrioritySchemeUpdateBean` - **required**

---

### DELETE /api/2/priorityschemes/{schemeId}

**Delete a priority scheme**

Deletes a priority scheme. All projects using deleted scheme will use default priority scheme afterwards.

**Parameters:**

- **Path:** `schemeId` (integer (int64)) - **required**

---

## project

### GET /api/2/project

**Get all visible projects**

Returns all projects which are visible for the currently logged in user. If no user is logged in, it returns the list of projects that are visible when using anonymous access.

**Parameters:**

- **Query:** `includeArchived` (boolean) - optional
- **Query:** `expand` (string) - optional
- **Query:** `recent` (integer (int32)) - optional
- **Query:** `browseArchive` (boolean) - optional

---

### POST /api/2/project

**Create a new project**

Creates a new project

**Parameters:**

- **Body:** `ProjectInputBean` - **required**

---

### GET /api/2/project/type

**Get all project types**

Returns all the project types defined on the Jira instance, not taking into account whether the license to use those project types is valid or not. In case of anonymous checks if they can access at least one project.

*No parameters*

---

### GET /api/2/project/type/{projectTypeKey}

**Get project type by key**

Returns the project type with the given key. In case of anonymous checks if they can access at least one project.

**Parameters:**

- **Path:** `projectTypeKey` (string) - **required**

---

### GET /api/2/project/type/{projectTypeKey}/accessible

**Get project type by key**

Returns the project type with the given key, if it is accessible to the logged in user. This takes into account whether the user is licensed on the Application that defines the project type.

**Parameters:**

- **Path:** `projectTypeKey` (string) - **required**

---

### GET /api/2/project/{projectIdOrKey}

**Get a project by ID or key**

Returns a full representation of a project in JSON format. All project keys associated with the project will only be returned if <code>expand=projectKeys</code>.

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**
- **Query:** `expand` (string) - optional

---

### PUT /api/2/project/{projectIdOrKey}

**Update a project**

Updates a project. Only non null values sent in JSON will be updated in the project. Values available for the assigneeType field are: "PROJECT_LEAD" and "UNASSIGNED".

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**
- **Query:** `expand` (string) - optional
- **Body:** `ProjectUpdateBean` - **required**

---

### DELETE /api/2/project/{projectIdOrKey}

**Delete a project**

Deletes a project

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**

---

### PUT /api/2/project/{projectIdOrKey}/archive

**Archive a project**

Archives a project

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**

---

### POST /api/2/project/{projectIdOrKey}/avatar

**Create avatar from temporary**

Converts the temporary avatar into the final one. This is step 2/3 of changing an avatar for a project:
- Upload (store temporary avatar)
- Crop (create avatar from temporary)
- Update (update project avatar)

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**
- **Body:** `AvatarCroppingBean` - **required**

---

### PUT /api/2/project/{projectIdOrKey}/avatar

**Update project avatar**

Updates an avatar for a project. This is step 3/3 of changing an avatar for a project.

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**
- **Body:** `AvatarBean` - **required**

---

### POST /api/2/project/{projectIdOrKey}/avatar/temporary

**Store temporary avatar using multipart**

Creates temporary avatar using multipart. The response is sent back as JSON stored in a textarea. This is because
the client uses remote iframing to submit avatars using multipart. So we must send them a valid HTML page back from
which the client parses the JSON.


**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**
- **Body:** `object` - optional

---

### DELETE /api/2/project/{projectIdOrKey}/avatar/{id}

**Delete an avatar**

Deletes avatar

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**
- **Path:** `id` (integer (int64)) - **required**

---

### GET /api/2/project/{projectIdOrKey}/avatars

**Get all avatars for a project**

Returns all avatars which are visible for the currently logged in user. The avatars are grouped into system and custom.

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**

---

### GET /api/2/project/{projectIdOrKey}/components

**Get project components**

Contains a full representation of the specified project's components.

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**

---

### GET /api/2/project/{projectIdOrKey}/properties

**Get keys of all properties for project**

Returns the keys of all properties for the project identified by the key or by the id.

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**

---

### GET /api/2/project/{projectIdOrKey}/properties/{propertyKey}

**Get value of property from project**

Returns the value of the property with a given key from the project identified by the key or by the id.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `projectIdOrKey` (string) - **required**

---

### PUT /api/2/project/{projectIdOrKey}/properties/{propertyKey}

**Set value of specified project's property**

Sets the value of the specified project's property. You can use this resource to store a custom data against the project identified by the key or by the id. The user who stores the data is required to have permissions to administer the project.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `projectIdOrKey` (string) - **required**
- **Body:** `PropertyBean` - **required**

---

### DELETE /api/2/project/{projectIdOrKey}/properties/{propertyKey}

**Delete property from project**

Removes the property from the project identified by the key or by the id.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `projectIdOrKey` (string) - **required**

---

### PUT /api/2/project/{projectIdOrKey}/restore

**Restore an archived project**

Restores an archived project. In case of success restored project should be re-indexed.

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**

---

### GET /api/2/project/{projectIdOrKey}/role

**Get all roles in project**

Returns all roles in the given project Id or key, with links to full details on each role.

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**

---

### GET /api/2/project/{projectIdOrKey}/role/{id}

**Get details for a project role**

Returns the details for a given project role in a project.

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**
- **Path:** `id` (integer (int64)) - **required**

---

### POST /api/2/project/{projectIdOrKey}/role/{id}

**Add actor to project role**

Adds an actor (user or group) to a project role. For user actors, their usernames should be used.

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**
- **Path:** `id` (integer (int64)) - **required**
- **Body:** `ActorsMap` - **required**

---

### PUT /api/2/project/{projectIdOrKey}/role/{id}

**Update project role with actors**

Updates a project role to include the specified actors (users or groups). Can be also used to clear roles to not include any users or groups. For user actors, their usernames should be used.

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**
- **Path:** `id` (integer (int64)) - **required**
- **Body:** `ProjectRoleActorsUpdateBean` - **required**

---

### DELETE /api/2/project/{projectIdOrKey}/role/{id}

**Delete actors from project role**

Deletes actors (users or groups) from a project role.

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**
- **Path:** `id` (integer (int64)) - **required**
- **Query:** `user` (string) - optional
- **Query:** `group` (string) - optional

---

### GET /api/2/project/{projectIdOrKey}/statuses

**Get all issue types with statuses for a project**

Get all issue types with valid status values for a project

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**

---

### PUT /api/2/project/{projectIdOrKey}/type/{newProjectTypeKey}

**Update project type**

Updates the type of a project

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**
- **Path:** `newProjectTypeKey` (string) - **required**

---

### GET /api/2/project/{projectIdOrKey}/version

**Get paginated project versions**

Returns all versions for the specified project. Results are paginated. Results can be ordered by the following fields: sequence, name, startDate, releaseDate.

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**
- **Query:** `expand` (string) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `orderBy` (string) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### GET /api/2/project/{projectIdOrKey}/versions

**Get project versions**

Contains a full representation of a the specified project's versions.

**Parameters:**

- **Path:** `projectIdOrKey` (string) - **required**
- **Query:** `expand` (string) - optional

---

### GET /api/2/project/{projectKeyOrId}/issuesecuritylevelscheme

**Get issue security scheme for project**

Returns the issue security scheme for project.

**Parameters:**

- **Path:** `projectKeyOrId` (string) - **required**

---

### GET /api/2/project/{projectKeyOrId}/notificationscheme

**Get notification scheme associated with the project**

Gets a notification scheme associated with the project. Follow the documentation of /notificationscheme/{id} resource for all details about returned value.

**Parameters:**

- **Path:** `projectKeyOrId` (string) - **required**
- **Query:** `expand` (string) - optional

---

### GET /api/2/project/{projectKeyOrId}/permissionscheme

**Get assigned permission scheme**

Gets a permission scheme assigned with a project

**Parameters:**

- **Path:** `projectKeyOrId` (string) - **required**
- **Query:** `expand` (string) - optional

---

### PUT /api/2/project/{projectKeyOrId}/permissionscheme

**Assign permission scheme to project**

Assigns a permission scheme with a project

**Parameters:**

- **Path:** `projectKeyOrId` (string) - **required**
- **Query:** `expand` (string) - optional
- **Body:** `IdBean` - **required**

---

### GET /api/2/project/{projectKeyOrId}/priorityscheme

**Get assigned priority scheme**

Gets a full representation of a priority scheme in JSON format used by specified project. User must be global administrator or project administrator. All project keys associated with the priority scheme will only be returned if additional query parameter is provided expand=projectKeys.

**Parameters:**

- **Path:** `projectKeyOrId` (string) - **required**

---

### PUT /api/2/project/{projectKeyOrId}/priorityscheme

**Assign project with priority scheme**

Assigns project with priority scheme. Priority scheme assign with migration is possible from the UI. Operation will fail if migration is needed as a result of operation eg. there are issues with priorities invalid in the destination scheme. All project keys associated with the priority scheme will only be returned if additional query parameter is provided expand=projectKeys.

**Parameters:**

- **Path:** `projectKeyOrId` (string) - **required**
- **Body:** `IdBean` - **required**

---

### DELETE /api/2/project/{projectKeyOrId}/priorityscheme/{schemeId}

**Unassign project from priority scheme**

Unassigns project from priority scheme. Operation will fail for defualt priority scheme, project is not found or project is not associated with provided priority scheme. All project keys associated with the priority scheme will only be returned if additional query parameter is provided expand=projectKeys.

**Parameters:**

- **Path:** `schemeId` (integer (int64)) - **required**
- **Path:** `projectKeyOrId` (string) - **required**

---

### GET /api/2/project/{projectKeyOrId}/securitylevel

**Get all security levels for project**

Returns all security levels for the project that the current logged in user has access to. If the user does not have the Set Issue Security permission, the list will be empty.

**Parameters:**

- **Path:** `projectKeyOrId` (string) - **required**

---

### GET /api/2/project/{projectKeyOrId}/workflowscheme

**Get workflow scheme for project**

Returns the workflow scheme that is associated with requested project.

**Parameters:**

- **Path:** `projectKeyOrId` (string) - **required**

---

## projectCategory

### GET /api/2/projectCategory

**Get all project categories**

Returns all project categories

*No parameters*

---

### POST /api/2/projectCategory

**Create project category**

Create a project category.

**Parameters:**

- **Body:** `ProjectCategoryBean` - **required**

---

### GET /api/2/projectCategory/{id}

**Get project category by ID**

Returns a full representation of the project category that has the given id.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**

---

### PUT /api/2/projectCategory/{id}

**Update project category**

Modify a project category.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Body:** `ProjectCategoryBean` - **required**

---

### DELETE /api/2/projectCategory/{id}

**Delete project category**

Delete a project category.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**

---

## projects

### GET /api/2/projects/picker

**Get projects matching query**

Returns a list of projects visible to the user where project name and/or key is matching the given query.
Passing an empty (or whitespace only) query will match no projects. The project matches will
contain a field with the query highlighted.
The number of projects returned can be controlled by passing a value for 'maxResults', but a hard limit of no
more than 100 projects is enforced. The projects are wrapped in a single response object that contains
a header for use in the picker, specifically 'Showing X of Y matching projects' and the total number
of matches for the query.

**Parameters:**

- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `query` (string) - optional
- **Query:** `allowEmptyQuery` (boolean) - optional

---

## projectvalidate

### GET /api/2/projectvalidate/key

**Get project key validation**

Validates a project key.

**Parameters:**

- **Query:** `key` (string) - optional

---

## reindex

### GET /api/2/reindex

**Get reindex information**

Returns information on the system reindexes. If a reindex is currently taking place then information about this reindex is returned. If there is no active index task, then returns information about the latest reindex task run, otherwise returns a 404 indicating that no reindex has taken place.

**Parameters:**

- **Query:** `taskId` (integer (int64)) - optional

---

### POST /api/2/reindex

**Start a reindex operation**

Kicks off a reindex. Need Admin permissions to perform this reindex.

**Parameters:**

- **Query:** `indexChangeHistory` (boolean) - optional
- **Query:** `type` (string) - optional
- **Query:** `indexWorklogs` (boolean) - optional
- **Query:** `indexComments` (boolean) - optional

---

### POST /api/2/reindex/issue

**Reindex individual issues**

Reindexes one or more individual issues. Indexing is performed synchronously - the call returns when indexing of the issues has completed or a failure occurs.

**Parameters:**

- **Query:** `issueId` (array) - optional
- **Query:** `indexChangeHistory` (boolean) - optional
- **Query:** `indexWorklogs` (boolean) - optional
- **Query:** `indexComments` (boolean) - optional

---

### GET /api/2/reindex/progress

**Get reindex progress**

Returns information on the system reindexes. If a reindex is currently taking place then information about this reindex is returned. If there is no active index task, then returns information about the latest reindex task run, otherwise returns a 404 indicating that no reindex has taken place.

**Parameters:**

- **Query:** `taskId` (integer (int64)) - optional

---

### POST /api/2/reindex/request

**Execute pending reindex requests**

Executes any pending reindex requests. Execution is asynchronous - progress of the returned tasks can be monitored through other REST calls.

*No parameters*

---

### GET /api/2/reindex/request/bulk

**Get progress of multiple reindex requests**

Retrieves the progress of multiple reindex requests. Only reindex requests that actually exist will be returned in the results.

**Parameters:**

- **Query:** `requestId` (array) - optional

---

### GET /api/2/reindex/request/{requestId}

**Get progress of a single reindex request**

Retrieves the progress of a single reindex request.

**Parameters:**

- **Path:** `requestId` (integer (int64)) - **required**

---

## resolution

### GET /api/2/resolution

**Get all resolutions**

Returns a list of all resolutions.

*No parameters*

---

### GET /api/2/resolution/page

**Get paginated filtered resolutions**

Returns paginated list of filtered resolutions.

**Parameters:**

- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `query` (string) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### GET /api/2/resolution/{id}

**Get a resolution by ID**

Returns a resolution.

**Parameters:**

- **Path:** `id` (string) - **required**

---

## role

### GET /api/2/role

**Get all project roles**

Get all the ProjectRoles available in Jira. Currently this list is global.

*No parameters*

---

### POST /api/2/role

**Create a new project role**

Creates a new ProjectRole to be available in Jira. The created role does not have any default actors assigned.

**Parameters:**

- **Body:** `CreateUpdateRoleRequestBean` - **required**

---

### GET /api/2/role/{id}

**Get a specific project role**

Get a specific ProjectRole available in Jira.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**

---

### POST /api/2/role/{id}

**Partially updates a role's name or description**

Partially updates a roles name or description.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Body:** `CreateUpdateRoleRequestBean` - optional

---

### PUT /api/2/role/{id}

**Fully updates a role's name and description**

Fully updates a roles. Both name and description must be given.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Body:** `CreateUpdateRoleRequestBean` - optional

---

### DELETE /api/2/role/{id}

**Deletes a role**

Deletes a role. May return 403 in the future

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Query:** `swap` (integer (int64)) - optional

---

### GET /api/2/role/{id}/actors

**Get default actors for a role**

Gets default actors for the given role.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**

---

### POST /api/2/role/{id}/actors

**Adds default actors to a role**

Adds default actors to the given role. The request data should contain a list of usernames or a list of groups to add.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Body:** `ActorInputBean` - optional

---

### DELETE /api/2/role/{id}/actors

**Removes default actor from a role**

Removes default actor from the given role.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Query:** `user` (string) - optional
- **Query:** `group` (string) - optional

---

## screens

### GET /api/2/screens

**Get available field screens**

Adds field or custom field to the default tab.

**Parameters:**

- **Query:** `search` (string) - optional
- **Query:** `expand` (string) - optional
- **Query:** `maxResults` (string) - optional
- **Query:** `startAt` (string) - optional

---

### POST /api/2/screens/addToDefault/{fieldId}

**Add field to default screen**

Moves field on the given tab.

**Parameters:**

- **Path:** `fieldId` (string) - **required**

---

### GET /api/2/screens/{screenId}/availableFields

**Get available fields for screen**

Gets available fields for screen. i.e ones that haven't already been added.

**Parameters:**

- **Path:** `screenId` (integer (int64)) - **required**

---

### GET /api/2/screens/{screenId}/tabs

**Get all tabs for a screen**

Returns a list of all tabs for the given screen.

**Parameters:**

- **Path:** `screenId` (integer (int64)) - **required**
- **Query:** `projectKey` (string) - optional

---

### POST /api/2/screens/{screenId}/tabs

**Create tab for a screen**

Creates tab for given screen.

**Parameters:**

- **Path:** `screenId` (integer (int64)) - **required**
- **Body:** `ScreenableTabBean` - optional

---

### PUT /api/2/screens/{screenId}/tabs/{tabId}

**Rename a tab on a screen**

Renames tab on given screen.

**Parameters:**

- **Path:** `tabId` (integer (int64)) - **required**
- **Path:** `screenId` (integer (int64)) - **required**
- **Body:** `ScreenableTabBean` - optional

---

### DELETE /api/2/screens/{screenId}/tabs/{tabId}

**Delete a tab from a screen**

Deletes tab from given screen.

**Parameters:**

- **Path:** `tabId` (integer (int64)) - **required**
- **Path:** `screenId` (integer (int64)) - **required**

---

### GET /api/2/screens/{screenId}/tabs/{tabId}/fields

**Get all fields for a tab**

Gets all fields for a given tab.

**Parameters:**

- **Path:** `tabId` (integer (int64)) - **required**
- **Path:** `screenId` (integer (int64)) - **required**
- **Query:** `projectKey` (string) - optional

---

### POST /api/2/screens/{screenId}/tabs/{tabId}/fields

**Add field to a tab**

Adds field to the given tab.

**Parameters:**

- **Path:** `tabId` (integer (int64)) - **required**
- **Path:** `screenId` (integer (int64)) - **required**
- **Body:** `AddFieldBean` - optional

---

### DELETE /api/2/screens/{screenId}/tabs/{tabId}/fields/{id}

**Remove field from tab**

Removes field from given tab.

**Parameters:**

- **Path:** `tabId` (integer (int64)) - **required**
- **Path:** `screenId` (integer (int64)) - **required**
- **Path:** `id` (string) - **required**

---

### POST /api/2/screens/{screenId}/tabs/{tabId}/fields/{id}/move

**Move field on a tab**

Moves field on the given tab.

**Parameters:**

- **Path:** `tabId` (integer (int64)) - **required**
- **Path:** `screenId` (integer (int64)) - **required**
- **Path:** `id` (string) - **required**
- **Body:** `MoveFieldBean` - optional

---

### PUT /api/2/screens/{screenId}/tabs/{tabId}/fields/{id}/updateShowWhenEmptyIndicator/{newValue}

**Update 'showWhenEmptyIndicator' for a field**

Update 'showWhenEmptyIndicator' for given field on screen.

**Parameters:**

- **Path:** `tabId` (integer (int64)) - **required**
- **Path:** `screenId` (integer (int64)) - **required**
- **Path:** `newValue` (boolean) - **required**
- **Path:** `id` (string) - **required**

---

### POST /api/2/screens/{screenId}/tabs/{tabId}/move/{pos}

**Move tab position**

Moves tab position.

**Parameters:**

- **Path:** `tabId` (integer (int64)) - **required**
- **Path:** `screenId` (integer (int64)) - **required**
- **Path:** `pos` (integer (int32)) - **required**

---

## search

### GET /api/2/search

**Get issues using JQL**

Searches for issues using JQL.
Sorting
the jql parameter is a full <a href="http://confluence.atlassian.com/display/JIRA/Advanced+Searching">JQL</a>
expression, and includes an ORDER BY clause.
The fields param (which can be specified multiple times) gives a comma-separated list of fields
to include in the response. This can be used to retrieve a subset of fields.
A particular field can be excluded by prefixing it with a minus.
By default, only navigable (*navigable) fields are returned in this search resource. Note: the default is different
in the get-issue resource -- the default there all fields (*all).
*all - include all fields
*navigable - include just navigable fields
summary,comment - include just the summary and comments
-description - include navigable fields except the description (the default is *navigable for search)
*all,-comment - include everything except comments
GET vs POST:
If the JQL query is too large to be encoded as a query param you should instead
POST to this resource.
Expanding Issues in the Search Result:
It is possible to expand the issues returned by directly specifying the expansion on the expand parameter passed
in to this resources.
For instance, to expand the changelog for all the issues on the search result, it is necessary to
specify changelog as one of the values to expand.

**Parameters:**

- **Query:** `expand` (StringList) - optional
- **Query:** `jql` (string) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `validateQuery` (boolean) - optional
- **Query:** `fields` (array) - optional
- **Query:** `startAt` (integer (int32)) - optional

---

### POST /api/2/search

**Perform search with JQL**

Performs a search using JQL.

**Parameters:**

- **Body:** `SearchRequestBean` - **required**

---

## securitylevel

### GET /api/2/securitylevel/{id}

**Get a security level by ID**

Returns a full representation of the security level that has the given id.

**Parameters:**

- **Path:** `id` (string) - **required**

---

## serverInfo

### GET /api/2/serverInfo

**Get general information about the current Jira server**

Returns general information about the current Jira server.

*No parameters*

---

## session

### GET /auth/1/session

**Get current user session information**

Returns information about the currently authenticated user's session. If the caller is not authenticated they will get a 401 Unauthorized status code.

*No parameters*

---

### POST /auth/1/session

**Create new user session**

Creates a new session for a user in Jira. Once a session has been successfully created it can be used to access any of Jira's remote APIs and also the web UI by passing the appropriate HTTP Cookie header. Note that it is generally preferrable to use HTTP BASIC authentication with the REST API. However, this resource may be used to mimic the behaviour of Jira's log-in page (e.g. to display log-in errors to a user).

**Parameters:**

- **Body:** `AuthParams` - **required**

---

### DELETE /auth/1/session

**Delete current user session**

Logs the current user out of Jira, destroying the existing session, if any.

*No parameters*

---

## settings

### PUT /api/2/settings/baseUrl

**Update base URL for Jira instance**

Sets the base URL that is configured for this Jira instance.

**Parameters:**

- **Body:** `string` - optional

---

### GET /api/2/settings/columns

**Get default system columns for issue navigator**

Returns the default system columns for issue navigator. Admin permission will be required.

*No parameters*

---

### PUT /api/2/settings/columns

**Set default system columns for issue navigator using form**

Sets the default system columns for issue navigator. Admin permission will be required.

**Parameters:**

- **Body:** `object` - optional

---

## sprint

### POST /agile/1.0/sprint

**Create a future sprint**

Creates a future sprint. Sprint name and origin board id are required. Start and end date are optional. Notes: The sprint name is trimmed. Only Jira administrators can create synced sprints.

**Parameters:**

- **Body:** `SprintCreateBean` - **required**

---

### PUT /agile/1.0/sprint/unmap

**Unmap sprints from being synced**

Sets the Synced flag to false for all sprints in the provided list.

**Parameters:**

- **Body:** `UnmapSprintsBean` - **required**

---

### PUT /agile/1.0/sprint/unmap-all

**Unmap all sprints from being synced**

Sets the Synced flag to false for all sprints on this Jira instance. This operation is intended for cleanup only. It is highly destructive and not reversible. Use with caution.

*No parameters*

---

### GET /agile/1.0/sprint/{sprintId}

**Get sprint by id**

Returns a single sprint, for a given sprint Id. The sprint will only be returned if the user can view the board that the sprint was created on, or view at least one of the issues in the sprint.

**Parameters:**

- **Path:** `sprintId` (integer (int64)) - **required**

---

### POST /agile/1.0/sprint/{sprintId}

**Partially update a sprint**

Performs a partial update of a sprint.
A partial update means that fields not present in the request JSON will not be updated.
Notes:
- Sprints that are in a closed state cannot be updated.
- A sprint can be started by updating the state to 'active'. This requires the sprint to be in the 'future' state and have a startDate and endDate set.
- A sprint can be completed by updating the state to 'closed'. This action requires the sprint to be in the 'active' state. This sets the completeDate to the time of the request.
  If the sprint has offending issues (those which are complete, but have incomplete subtasks) it cannot be closed.
  If issues are moved to new sprint user has to have issues edit permissions.
- Other changes to state are not allowed.
- The completeDate field cannot be updated manually.
- Sprint goal can be removed by updating it's value to empty string
- Only Jira administrators can edit dates on sprints that are marked as synced.

**Parameters:**

- **Path:** `sprintId` (integer (int64)) - **required**
- **Body:** `SprintBean` - **required**

---

### PUT /agile/1.0/sprint/{sprintId}

**Update a sprint fully**

Performs a full update of a sprint.
A full update means that the result will be exactly the same as the request body.
Any fields not present in the request JSON will be set to null.
Notes:
- Sprints that are in a closed state cannot be updated.
- A sprint can be started by updating the state to 'active'. This requires the sprint to be in the 'future' state and have a startDate and endDate set.
- A sprint can be completed by updating the state to 'closed'. This action requires the sprint to be in the 'active' state. This sets the completeDate to the time of the request.
  If the sprint has offending issues (those which are complete, but have incomplete subtasks) it cannot be closed.
  If issues are moved to new sprint user has to have issues edit permissions.
- Other changes to state are not allowed.
- The completeDate field cannot be updated manually.
- Only Jira administrators can edit dates on sprints that are marked as synced.

**Parameters:**

- **Path:** `sprintId` (integer (int64)) - **required**
- **Body:** `SprintBean` - **required**

---

### DELETE /agile/1.0/sprint/{sprintId}

**Delete a sprint**

Deletes a sprint. Once a sprint is deleted, all issues in the sprint will be moved to the backlog. To delete a synced sprint, you must unsync it first.

**Parameters:**

- **Path:** `sprintId` (integer (int64)) - **required**

---

### GET /agile/1.0/sprint/{sprintId}/issue

**Get all issues in a sprint**

Returns all issues in a sprint, for a given sprint Id. This only includes issues that the user has permission to view. By default, the returned issues are ordered by rank.

**Parameters:**

- **Path:** `sprintId` (integer (int64)) - **required**
- **Query:** `expand` (string) - optional
- **Query:** `jql` (string) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `validateQuery` (boolean) - optional
- **Query:** `fields` (array) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### POST /agile/1.0/sprint/{sprintId}/issue

**Move issues to a sprint**

Moves issues to a sprint, for a given sprint Id. Issues can only be moved to open or active sprints. The maximum number of issues that can be moved in one operation is 50.

**Parameters:**

- **Path:** `sprintId` (integer (int64)) - **required**
- **Body:** `IssueAssignRequestBean` - **required**

---

### GET /agile/1.0/sprint/{sprintId}/properties

**Get all properties keys for a sprint**

Returns the keys of all properties for the sprint identified by the id. The user who retrieves the property keys is required to have permissions to view the sprint.

**Parameters:**

- **Path:** `sprintId` (string) - **required**

---

### GET /agile/1.0/sprint/{sprintId}/properties/{propertyKey}

**Get a property for a sprint**

Returns the value of the property with a given key from the sprint identified by the provided id. The user who retrieves the property is required to have permissions to view the sprint.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `sprintId` (string) - **required**

---

### PUT /agile/1.0/sprint/{sprintId}/properties/{propertyKey}

**Update a sprint's property**

Sets the value of the specified sprint's property. You can use this resource to store a custom data against the sprint identified by the id. The user who stores the data is required to have permissions to modify the sprint.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `sprintId` (string) - **required**

---

### DELETE /agile/1.0/sprint/{sprintId}/properties/{propertyKey}

**Delete a sprint's property**

Removes the property from the sprint identified by the id. Ths user removing the property is required to have permissions to modify the sprint.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Path:** `sprintId` (string) - **required**

---

### POST /agile/1.0/sprint/{sprintId}/swap

**Swap the position of two sprints**

Swap the position of the sprint with the second sprint.

**Parameters:**

- **Path:** `sprintId` (integer (int64)) - **required**
- **Body:** `SprintSwapBean` - **required**

---

## status

### GET /api/2/status

**Get all statuses**

Returns a list of all statuses

*No parameters*

---

### GET /api/2/status/page

**Get paginated filtered statuses**

Returns paginated list of filtered statuses

**Parameters:**

- **Query:** `issueTypeIds` (array) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `query` (string) - optional
- **Query:** `projectIds` (array) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### GET /api/2/status/{idOrName}

**Get status by ID or name**

Returns a full representation of the Status having the given id or name.

**Parameters:**

- **Path:** `idOrName` (string) - **required**

---

## statuscategory

### GET /api/2/statuscategory

**Get all status categories**

Returns a list of all status categories

**Parameters:**

- **Query:** `request` (string) - optional
- **Query:** `uriInfo` (string) - optional

---

### GET /api/2/statuscategory/{idOrKey}

**Get status category by ID or key**

Returns a full representation of the StatusCategory having the given id or key

**Parameters:**

- **Path:** `idOrKey` (string) - **required**

---

## terminology

### GET /api/2/terminology/entries

**Get all defined names for 'epic' and 'sprint'**

Returns a list of all defined names for the default words 'epic' and 'sprint'

*No parameters*

---

### POST /api/2/terminology/entries

**Update epic/sprint names from original to new**

Change epic/sprint names from {originalName} to {newName}. The {newName} will be displayed in Jira instead of {originalName}
{"originalName"} must be equal to "epic" or "sprint".
There can be only one entry per unique {"originalName"}.
{"newName"} can only consist of alphanumeric characters and spaces e.g. {"newName": "iteration number 2"}.
{"newName"} must be between 1 to 100 characters.
It can't use the already defined {"newName"} values or restricted JQL words.
To reset {"newName"} to the default value, enter the {"originalName"} value as the value for {"newName"}. For example, if you want to return to {"originalName": "sprint"}, enter {"newName": "sprint"}.

**Parameters:**

- **Body:** `TerminologyRequestBean` - **required**

---

### GET /api/2/terminology/entries/{originalName}

**Get epic or sprint name by original name**

Returns epic or sprint name as specified in the {originalName} path param

**Parameters:**

- **Path:** `originalName` (string) - **required**

---

## universal_avatar

### GET /api/2/universal_avatar/type/{type}/owner/{owningObjectId}

**Get all avatars for a type and owner**

Returns a list of all avatars

**Parameters:**

- **Path:** `type` (string) - **required**
- **Path:** `owningObjectId` (string) - **required**

---

### POST /api/2/universal_avatar/type/{type}/owner/{owningObjectId}/avatar

**Create avatar from temporary**

Creates avatar from temporary

**Parameters:**

- **Path:** `type` (string) - **required**
- **Path:** `owningObjectId` (string) - **required**
- **Body:** `AvatarCroppingBean` - optional

---

### DELETE /api/2/universal_avatar/type/{type}/owner/{owningObjectId}/avatar/{id}

**Delete avatar by ID**

Deletes avatar

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Path:** `type` (string) - **required**
- **Path:** `owningObjectId` (string) - **required**

---

### POST /api/2/universal_avatar/type/{type}/owner/{owningObjectId}/temp

**Create temporary avatar using multipart upload**

Creates temporary avatar

**Parameters:**

- **Path:** `type` (string) - **required**
- **Path:** `owningObjectId` (string) - **required**
- **Body:** `object` - optional

---

## upgrade

### GET /api/2/upgrade

**Get result of the last upgrade task**

Returns the result of the last upgrade task.

*No parameters*

---

### POST /api/2/upgrade

**Run pending upgrade tasks**

Runs any pending delayed upgrade tasks. Need Admin permissions to do this.

*No parameters*

---

## user

### GET /api/2/user

**Get user by username or key**

Returns a user.

**Parameters:**

- **Query:** `includeDeleted` (boolean) - optional
- **Query:** `key` (string) - optional
- **Query:** `username` (string) - optional

---

### POST /api/2/user

**Create new user**

Create user. By default created user will not be notified with email. If password field is not set then password will be randomly generated.

**Parameters:**

- **Body:** `UserWriteBean` - **required**

---

### PUT /api/2/user

**Update user details**

Modify user. The 'value' fields present will override the existing value. Fields skipped in request will not be changed.

**Parameters:**

- **Query:** `key` (string) - optional
- **Query:** `username` (string) - optional
- **Body:** `UserWriteBean` - **required**

---

### DELETE /api/2/user

**Delete user**

Removes user and its references (like project roles associations, watches, history). Note: user references will not be removed if multiple User Directories are used and there is a user with the same name existing in another directory (shadowing user).

**Parameters:**

- **Query:** `key` (string) - optional
- **Query:** `username` (string) - optional

---

### GET /api/2/user/a11y/personal-settings

**Get available accessibility personal settings**

Returns available accessibility personal settings along with `enabled` property that indicates the currently logged-in user preference.

*No parameters*

---

### GET /api/2/user/anonymization

**Get validation for user anonymization**

Validates user anonymization process.

**Parameters:**

- **Query:** `expand` (string) - optional
- **Query:** `userKey` (string) - optional

---

### POST /api/2/user/anonymization

**Schedule user anonymization**

Schedules a user anonymization process. Requires system admin permission.

**Parameters:**

- **Body:** `UserAnonymizationRequestBean` - **required**

---

### GET /api/2/user/anonymization/progress

**Get user anonymization progress**

Returns information about a user anonymization operation progress.

**Parameters:**

- **Query:** `taskId` (integer (int64)) - optional

---

### GET /api/2/user/anonymization/rerun

**Get validation for user anonymization rerun**

Validates user anonymization re-run process.

**Parameters:**

- **Query:** `expand` (string) - optional
- **Query:** `oldUserKey` (string) - optional
- **Query:** `oldUserName` (string) - optional
- **Query:** `userKey` (string) - optional

---

### POST /api/2/user/anonymization/rerun

**Schedule user anonymization rerun**

Schedules a user anonymization process. Requires system admin permission.

**Parameters:**

- **Body:** `UserAnonymizationRerunRequestBean` - **required**

---

### DELETE /api/2/user/anonymization/unlock

**Delete stale user anonymization task**

Removes stale user anonymization task, for scenarios when the node that was executing it is no longer alive. Use it only after making sure that the parent node of the task is actually down, and not just having connectivity issues.

*No parameters*

---

### POST /api/2/user/application

**Add user to application**

Add user to given application. Admin permission will be required to perform this operation.

**Parameters:**

- **Query:** `applicationKey` (string) - optional
- **Query:** `username` (string) - optional

---

### DELETE /api/2/user/application

**Remove user from application**

Remove user from given application. Admin permission will be required to perform this operation.

**Parameters:**

- **Query:** `applicationKey` (string) - optional
- **Query:** `username` (string) - optional

---

### GET /api/2/user/assignable/multiProjectSearch

**Find bulk assignable users**

Returns a list of users that match the search string and can be assigned issues for all the given projects.

**Parameters:**

- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `projectKeys` (string) - optional
- **Query:** `username` (string) - optional

---

### GET /api/2/user/assignable/search

**Find assignable users by username**

Returns a list of users that match the search string. This resource cannot be accessed anonymously. Please note that this resource should be called with an issue key when a list of assignable users is retrieved. For create only a project key should be supplied. The list of assignable users may be incorrect if it's called with the project key for editing.

**Parameters:**

- **Query:** `issueKey` (string) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `project` (string) - optional
- **Query:** `actionDescriptorId` (integer (int32)) - optional
- **Query:** `username` (string) - optional

---

### POST /api/2/user/avatar

**Create avatar from temporary**

Converts temporary avatar into a real avatar

**Parameters:**

- **Query:** `username` (string) - optional
- **Body:** `AvatarCroppingBean` - **required**

---

### PUT /api/2/user/avatar

**Update user avatar**

Updates the avatar for the user.

**Parameters:**

- **Query:** `username` (string) - optional
- **Body:** `AvatarBean` - **required**

---

### POST /api/2/user/avatar/temporary

**Store temporary avatar using multipart**

Creates temporary avatar using multipart. The response is sent back as JSON stored in a textarea. This is because the client uses remote iframing to submit avatars using multipart. So we must send them a valid HTML page back from which the client parses the JSON from.
Creating a temporary avatar is part of a 3-step process in uploading a new avatar for a user: upload, crop, confirm. This endpoint allows you to use a multipart upload instead of sending the image directly as the request body.
You *must* use "avatar" as the name of the upload parameter:
curl -c cookiejar.txt -X POST -u admin:admin -H "X-Atlassian-Token: no-check" \
  -F "avatar=@mynewavatar.png;type=image/png" \
  'http://localhost:8090/jira/rest/api/2/user/avatar/temporary?username=admin'

**Parameters:**

- **Query:** `username` (string) - optional
- **Body:** `object` - **required**

---

### DELETE /api/2/user/avatar/{id}

**Delete avatar**

Deletes avatar

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Query:** `username` (string) - optional

---

### GET /api/2/user/avatars

**Get all avatars for user**

Returns all avatars which are visible for the currently logged in user.

**Parameters:**

- **Query:** `username` (string) - optional

---

### GET /api/2/user/columns

**Get default columns for user**

Returns the default columns for the given user. Admin permission will be required to get columns for a user other than the currently logged in user.

**Parameters:**

- **Query:** `username` (string) - optional

---

### PUT /api/2/user/columns

**Set default columns for user**

Sets the default columns for the given user. Admin permission will be required to get columns for a user other than the currently logged in user.

**Parameters:**

- **Body:** `object` - optional

---

### DELETE /api/2/user/columns

**Reset default columns to system default**

Reset the default columns for the given user to the system default. Admin permission will be required to get columns for a user other than the currently logged in user.

**Parameters:**

- **Query:** `username` (string) - optional

---

### GET /api/2/user/duplicated/count

**Get duplicated users count**

Returns a list of users that match the search string. This resource cannot be accessed anonymously.
Duplicated means that the user has an account in more than one directory
and either more than one account is active or the only active account does not belong to the directory
with the highest priority.
The data returned by this endpoint is cached for 10 minutes and the cache is flushed when any User Directory
is added, removed, enabled, disabled, or synchronized.
A System Administrator can also flush the cache manually.
Related JAC ticket: https://jira.atlassian.com/browse/JRASERVER-68797

**Parameters:**

- **Query:** `flush` (boolean) - optional

---

### GET /api/2/user/duplicated/list

**Get duplicated users mapping**

Returns duplicated users mapped to their directories with an indication if their accounts are active or not.
Duplicated means that the user has an account in more than one directory and either more than one account is active
or the only active account does not belong to the directory with the highest priority.
The data returned by this endpoint is cached for 10 minutes and the cache is flushed when any User Directory
is added, removed, enabled, disabled, or synchronized.
A System Administrator can also flush the cache manually.
Related JAC ticket: https://jira.atlassian.com/browse/JRASERVER-68797

**Parameters:**

- **Query:** `flush` (boolean) - optional

---

### PUT /api/2/user/password

**Update user password**

Modify user password.

**Parameters:**

- **Query:** `key` (string) - optional
- **Query:** `username` (string) - optional
- **Body:** `PasswordBean` - **required**

---

### GET /api/2/user/permission/search

**Find users with all specified permissions**

Returns a list of active users that match the search string and have all specified permissions for the project or issue. This resource can be accessed by users with ADMINISTER_PROJECT permission for the project or global ADMIN or SYSADMIN rights. This endpoint can cause serious performance issues and will be removed in Jira 9.0.

**Parameters:**

- **Query:** `projectKey` (string) - optional
- **Query:** `issueKey` (string) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `permissions` (string) - optional
- **Query:** `startAt` (integer (int32)) - optional
- **Query:** `username` (string) - optional

---

### GET /api/2/user/picker

**Find users for picker by query**

Returns a list of users matching query with highlighting.

**Parameters:**

- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `query` (string) - optional
- **Query:** `exclude` (array) - optional
- **Query:** `showAvatar` (boolean) - optional

---

### GET /api/2/user/properties

**Get keys of all properties for a user**

Returns the keys of all properties for the user identified by the key or by the id.

**Parameters:**

- **Query:** `userKey` (string) - optional
- **Query:** `username` (string) - optional

---

### GET /api/2/user/properties/{propertyKey}

**Get the value of a specified user's property**

Returns the value of the property with a given key from the user identified by the key or by the id.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Query:** `userKey` (string) - optional
- **Query:** `username` (string) - optional

---

### PUT /api/2/user/properties/{propertyKey}

**Set the value of a specified user's property**

Sets the value of the specified user's property.
You can use this resource to store a custom data against the user identified by the key or by the id. The user
who stores the data is required to have permissions to administer the user.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Query:** `userKey` (string) - optional
- **Query:** `username` (string) - optional
- **Body:** `string` - optional

---

### DELETE /api/2/user/properties/{propertyKey}

**Delete a specified user's property**

Removes the property from the user identified by the key or by the id. The user who removes the property is required to have permissions to administer the user.

**Parameters:**

- **Path:** `propertyKey` (string) - **required**
- **Query:** `userKey` (string) - optional
- **Query:** `username` (string) - optional

---

### GET /api/2/user/search

**Find users by username**

Finds users.

**Parameters:**

- **Query:** `includeInactive` (boolean) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `includeActive` (boolean) - optional
- **Query:** `startAt` (integer (int32)) - optional
- **Query:** `username` (string) - optional

---

### DELETE /api/2/user/session/{username}

**Delete user session**

Invalidates session of given user.

**Parameters:**

- **Path:** `username` (string) - **required**

---

### GET /api/2/user/viewissue/search

**Find users with browse permission**

Returns a list of active users that match the search string. This resource cannot be accessed anonymously and requires the Browse Users global permission. Given an issue key this resource will provide a list of users that match the search string and have the browse issue permission for the issue provided.

**Parameters:**

- **Query:** `projectKey` (string) - optional
- **Query:** `issueKey` (string) - optional
- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `username` (string) - optional

---

## version

### GET /api/2/version

**Get paginated versions**

Retrieve paginated collection of versions matching given query optionally filtered by given project IDs.

**Parameters:**

- **Query:** `maxResults` (integer (int32)) - optional
- **Query:** `query` (string) - optional
- **Query:** `projectIds` (array) - optional
- **Query:** `startAt` (integer (int64)) - optional

---

### POST /api/2/version

**Create new version**

Creates a version.

**Parameters:**

- **Body:** `VersionBean` - **required**

---

### GET /api/2/version/remotelink

**Get remote version links by global ID**

Returns the remote version links for a given global ID.

**Parameters:**

- **Query:** `globalId` (string) - optional

---

### GET /api/2/version/{id}

**Get version details**

Returns a version.

**Parameters:**

- **Path:** `id` (string) - **required**
- **Query:** `expand` (string) - optional

---

### PUT /api/2/version/{id}

**Update version details**

Updates a version.

**Parameters:**

- **Path:** `id` (string) - **required**
- **Body:** `VersionBean` - **required**

---

### PUT /api/2/version/{id}/mergeto/{moveIssuesTo}

**Merge versions**

**Parameters:**

- **Path:** `moveIssuesTo` (string) - **required**
- **Path:** `id` (string) - **required**

---

### POST /api/2/version/{id}/move

**Modify version's sequence**

Modify a version's sequence within a project.
The move version bean has 2 alternative field value pairs:
- position: An absolute position, which may have a value of 'First', 'Last', 'Earlier' or 'Later'
- after: A version to place this version after.  The value should be the self link of another version

**Parameters:**

- **Path:** `id` (string) - **required**
- **Body:** `VersionMoveBean` - **required**

---

### GET /api/2/version/{id}/relatedIssueCounts

**Get version related issues count**

Returns a bean containing the number of fixed in and affected issues for the given version.

**Parameters:**

- **Path:** `id` (string) - **required**

---

### POST /api/2/version/{id}/removeAndSwap

**Delete version and replace values**

Delete a project version, removed values will be replaced with ones specified by the parameters.

**Parameters:**

- **Path:** `id` (string) - **required**
- **Body:** `DeleteAndReplaceVersionBean` - **required**

---

### GET /api/2/version/{id}/unresolvedIssueCount

**Get version unresolved issues count**

Returns the number of unresolved issues for the given version

**Parameters:**

- **Path:** `id` (string) - **required**

---

### GET /api/2/version/{versionId}/remotelink

**Get remote version links by version ID**

Returns the remote version links associated with the given version ID.

**Parameters:**

- **Path:** `versionId` (string) - **required**

---

### POST /api/2/version/{versionId}/remotelink

**Create or update remote version link without global ID**

Create a remote version link via POST. The link's global ID will be taken from the JSON payload if provided; otherwise, it will be generated.

**Parameters:**

- **Path:** `versionId` (string) - **required**
- **Body:** `RemoteEntityLinkJsonBean` - **required**

---

### DELETE /api/2/version/{versionId}/remotelink

**Delete all remote version links for version**

Delete all remote version links for a given version ID.

**Parameters:**

- **Path:** `versionId` (string) - **required**

---

### GET /api/2/version/{versionId}/remotelink/{globalId}

**Get specific remote version link**

Returns the remote version link associated with the given version ID and global ID.

**Parameters:**

- **Path:** `versionId` (string) - **required**
- **Path:** `globalId` (string) - **required**

---

### POST /api/2/version/{versionId}/remotelink/{globalId}

**Create or update remote version link with global ID**

Create a remote version link via POST using the provided global ID.

**Parameters:**

- **Path:** `versionId` (string) - **required**
- **Path:** `globalId` (string) - **required**
- **Body:** `RemoteEntityLinkJsonBean` - **required**

---

### DELETE /api/2/version/{versionId}/remotelink/{globalId}

**Delete specific remote version link**

Delete a specific remote version link with the given version ID and global ID.

**Parameters:**

- **Path:** `versionId` (string) - **required**
- **Path:** `globalId` (string) - **required**

---

## websudo

### DELETE /auth/1/websudo

**Invalidate the current WebSudo session**

This method invalidates the any current WebSudo session.

**Parameters:**

- **Body:** `string` - optional

---

## workflow

### GET /api/2/workflow

**Get all workflows**

Returns all workflows. The “lastModifiedDate” is returned in Jira Complete Date/Time Format (dd/MMM/yy h:mm by default), but can also be returned as a relative date.

**Parameters:**

- **Query:** `workflowName` (string) - optional

---

## workflowscheme

### POST /api/2/workflowscheme

**Create a new workflow scheme**

Create a new workflow scheme. The body contains a representation of the new scheme. Values not passed are assumed to be set to their defaults.

**Parameters:**

- **Body:** `WorkflowSchemeBean` - **required**

---

### GET /api/2/workflowscheme/{id}

**Get requested workflow scheme by ID**

Returns the requested workflow scheme to the caller.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Query:** `returnDraftIfExists` (boolean) - optional

---

### PUT /api/2/workflowscheme/{id}

**Update a specified workflow scheme**

Update the passed workflow scheme. The body of the request is a representation of the workflow scheme. Values not passed are assumed to indicate no change for that field.
The passed representation can have its updateDraftIfNeeded flag set to true to indicate that the draft
should be created and/or updated when the actual scheme cannot be edited (e.g. when the scheme is being used by
a project). Values not appearing the body will not be touched.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Body:** `WorkflowSchemeBean` - **required**

---

### DELETE /api/2/workflowscheme/{id}

**Delete the specified workflow scheme**

Delete the passed workflow scheme.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**

---

### POST /api/2/workflowscheme/{id}/createdraft

**Create a draft for a workflow scheme**

Create a draft for the passed scheme. The draft will be a copy of the state of the parent.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**

---

### GET /api/2/workflowscheme/{id}/default

**Get default workflow for a scheme**

Return the default workflow from the passed workflow scheme.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Query:** `returnDraftIfExists` (boolean) - optional

---

### PUT /api/2/workflowscheme/{id}/default

**Update default workflow for a scheme**

Set the default workflow for the passed workflow scheme. The passed representation can have its
updateDraftIfNeeded flag set to true to indicate that the draft should be created/updated when the actual scheme
cannot be edited.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Body:** `DefaultBean` - **required**

---

### DELETE /api/2/workflowscheme/{id}/default

**Remove default workflow from a scheme**

Remove the default workflow from the passed workflow scheme.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Query:** `updateDraftIfNeeded` (boolean) - optional

---

### GET /api/2/workflowscheme/{id}/draft

**Get requested draft workflow scheme by ID**

Returns the requested draft workflow scheme to the caller.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**

---

### PUT /api/2/workflowscheme/{id}/draft

**Update a draft workflow scheme**

Update a draft workflow scheme. The draft will created if necessary. The body of the request is a representation of the workflow scheme. Values not passed are assumed to indicate no change for that field.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Body:** `WorkflowSchemeBean` - **required**

---

### DELETE /api/2/workflowscheme/{id}/draft

**Delete the specified draft workflow scheme**

Delete the passed draft workflow scheme.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**

---

### GET /api/2/workflowscheme/{id}/draft/default

**Get default workflow for a draft scheme**

Return the default workflow from the passed draft workflow scheme to the caller.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**

---

### PUT /api/2/workflowscheme/{id}/draft/default

**Update default workflow for a draft scheme**

Set the default workflow for the passed draft workflow scheme.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Body:** `DefaultBean` - **required**

---

### DELETE /api/2/workflowscheme/{id}/draft/default

**Remove default workflow from a draft scheme**

Remove the default workflow from the passed draft workflow scheme.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**

---

### GET /api/2/workflowscheme/{id}/draft/issuetype/{issueType}

**Get issue type mapping for a draft scheme**

Returns the issue type mapping for the passed draft workflow scheme.

**Parameters:**

- **Path:** `issueType` (string) - **required**
- **Path:** `id` (integer (int64)) - **required**

---

### PUT /api/2/workflowscheme/{id}/draft/issuetype/{issueType}

**Set an issue type mapping for a draft scheme**

Set the issue type mapping for the passed draft scheme. The passed representation can have its updateDraftIfNeeded flag set to true to indicate that
the draft should be created/updated when the actual scheme cannot be edited.

**Parameters:**

- **Path:** `issueType` (string) - **required**
- **Path:** `id` (integer (int64)) - **required**
- **Body:** `IssueTypeMappingBean` - **required**

---

### DELETE /api/2/workflowscheme/{id}/draft/issuetype/{issueType}

**Delete an issue type mapping from a draft scheme**

Remove the specified issue type mapping from the draft scheme.

**Parameters:**

- **Path:** `issueType` (string) - **required**
- **Path:** `id` (integer (int64)) - **required**

---

### GET /api/2/workflowscheme/{id}/draft/workflow

**Get draft workflow mappings**

Returns the draft workflow mappings or requested mapping to the caller.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Query:** `workflowName` (string) - optional

---

### PUT /api/2/workflowscheme/{id}/draft/workflow

**Update a workflow mapping in a draft scheme**

Update the draft scheme to include the passed mapping. The body is a representation of the workflow mapping. Values not passed are assumed to indicate no change for that field.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Query:** `workflowName` (string) - optional
- **Body:** `WorkflowMappingBean` - **required**

---

### DELETE /api/2/workflowscheme/{id}/draft/workflow

**Delete a workflow mapping from a draft scheme**

Delete the passed workflow from the draft workflow scheme.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Query:** `workflowName` (string) - optional

---

### GET /api/2/workflowscheme/{id}/issuetype/{issueType}

**Get issue type mapping for a scheme**

Returns the issue type mapping for the passed workflow scheme.

**Parameters:**

- **Path:** `issueType` (string) - **required**
- **Path:** `id` (integer (int64)) - **required**
- **Query:** `returnDraftIfExists` (boolean) - optional

---

### PUT /api/2/workflowscheme/{id}/issuetype/{issueType}

**Set an issue type mapping for a scheme**

Set the issue type mapping for the passed scheme. The passed representation can have its updateDraftIfNeeded flag set to true to indicate that
the draft should be created/updated when the actual scheme cannot be edited.

**Parameters:**

- **Path:** `issueType` (string) - **required**
- **Path:** `id` (integer (int64)) - **required**
- **Body:** `IssueTypeMappingBean` - **required**

---

### DELETE /api/2/workflowscheme/{id}/issuetype/{issueType}

**Delete an issue type mapping from a scheme**

Remove the specified issue type mapping from the scheme.

**Parameters:**

- **Path:** `issueType` (string) - **required**
- **Path:** `id` (integer (int64)) - **required**
- **Query:** `updateDraftIfNeeded` (boolean) - optional

---

### GET /api/2/workflowscheme/{id}/workflow

**Get workflow mappings for a scheme**

Returns the workflow mappings or requested mapping to the caller for the passed scheme.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Query:** `workflowName` (string) - optional
- **Query:** `returnDraftIfExists` (boolean) - optional

---

### PUT /api/2/workflowscheme/{id}/workflow

**Update a workflow mapping in a scheme**

Update the scheme to include the passed mapping. The body is a representation of the workflow mapping. Values not passed are assumed to indicate no change for that field.
The passed representation can have its updateDraftIfNeeded flag set to true to indicate that the draft
should be created/updated when the actual scheme cannot be edited.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Query:** `workflowName` (string) - optional
- **Body:** `WorkflowMappingBean` - **required**

---

### DELETE /api/2/workflowscheme/{id}/workflow

**Delete a workflow mapping from a scheme**

Delete the passed workflow from the workflow scheme.

**Parameters:**

- **Path:** `id` (integer (int64)) - **required**
- **Query:** `updateDraftIfNeeded` (boolean) - optional
- **Query:** `workflowName` (string) - optional

---

## worklog

### GET /api/2/worklog/deleted

**Returns worklogs deleted since given time.**

Returns worklogs id and delete time of worklogs that was deleted since given time. The returns set of worklogs is limited to 1000 elements. This API will not return worklogs deleted during last minute.

**Parameters:**

- **Query:** `since` (integer (int64)) - optional

---

### POST /api/2/worklog/list

**Returns worklogs for given ids.**

Returns worklogs for given worklog ids. Only worklogs to which the calling user has permissions, will be included in the result. The returns set of worklogs is limited to 1000 elements.

**Parameters:**

- **Body:** `WorklogIdsRequestBean` - **required**

---

### GET /api/2/worklog/updated

**Returns worklogs updated since given time.**

Returns worklogs id and update time of worklogs that was updated since given time. The returns set of worklogs is limited to 1000 elements. This API will not return worklogs updated during last minute.

**Parameters:**

- **Query:** `since` (integer (int64)) - optional

---

