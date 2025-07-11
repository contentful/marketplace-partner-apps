import { Badge, Box, Table } from "@contentful/f36-components";
import React from "react";
import { TranslationHistory } from "utils/api/ApiHistory";
import RenderInformation from "utils/RenderInformation";

type LimitBadge = "imported" | "intranslation" | "queued" | "none";

type TranslationHistorySortable = TranslationHistory & {
	sortable: number;
	type: LimitBadge;
}

function getTypeLabel(type: LimitBadge)
{
	switch(type)
	{
		case "imported":
			return "translated and imported";
		case "intranslation":
			return "currently in translation";
		default: 
			return "queued for translation job";
	}
}

export default function History(props: { history: TranslationHistory[] }) {

	const [showBadge, setShowBadge] = React.useState<LimitBadge>("none");

	let imported = 0;
	let intranslation = 0;
	let waiting = 0;
	const sortable: TranslationHistorySortable[] = [];

	props.history.forEach(e => {
		if (e["time-imported"] > 0 && e["time-imported"] > e["time-intranslation"] && e["time-imported"] > e["time-requested"]) {
			sortable.push({ ...e, sortable: e["time-imported"], type: "imported" });
			imported++;
		}
		else if (e["time-intranslation"] > 0 && e["time-intranslation"] > e["time-imported"] && e["time-intranslation"] > e["time-requested"]) {
			sortable.push({ ...e, sortable: e["time-intranslation"], type: "intranslation"  });
			intranslation++;
		}
		else if (e["time-requested"] > 0 && e["time-requested"] > e["time-imported"] && e["time-requested"] > e["time-intranslation"]) {
			sortable.push({ ...e, sortable: e["time-requested"], type: "queued"  });
			waiting++;
		}
	});

	if (!imported && !intranslation && !waiting) {
		return <Box marginTop="spacingM" style={{ textAlign: "center"}}>
			<RenderInformation text="There is no translation history available, yet..." />
		</Box>
	}

	sortable.sort((a, b) => b.sortable - a.sortable);

	const updateBadge = function (key: LimitBadge) {
		
		if (key === "intranslation" && intranslation)
			setShowBadge(showBadge !== "intranslation" ? "intranslation" : "none");
		else if (key === "imported" && imported)
			setShowBadge(showBadge !== "imported" ? "imported" : "none");
		else if (key === "queued" && imported)
			setShowBadge(showBadge !== "queued" ? "queued" : "none");
	}

	const StyleBadge = { cursor: "pointer", margin: "0 1em" }
	const StyleBadgeDisabled = { cursor: "default", margin: "0 1em" }

	return <Box style={{ padding: "2em 0" }}>
		<div style={{ textAlign: "center", paddingBottom: "2em" }}>
			Filter by status: <Badge variant={showBadge === "imported" ? "primary" : "secondary"} onClick={() => {if (imported>0)updateBadge("imported")}} style={imported>0?StyleBadge:StyleBadgeDisabled}>Translated and imported ({imported})</Badge>
			<Badge variant={showBadge === "intranslation" ? "primary" : "secondary"} onClick={() => {if (intranslation>0) updateBadge("intranslation")}} style={intranslation>0?StyleBadge:StyleBadgeDisabled}>In translation ({intranslation})</Badge>
			<Badge variant={showBadge === "queued" ? "primary" : "secondary"} onClick={() => { if (waiting > 0) updateBadge("queued")}} style={waiting>0?StyleBadge:StyleBadgeDisabled}>Queued ({waiting})</Badge>
		</div>

		<Table>
			<Table.Head>
				<Table.Row>
					<Table.Cell>Name</Table.Cell>
					<Table.Cell>Target</Table.Cell>
					<Table.Cell>Status</Table.Cell>
					<Table.Cell>Time</Table.Cell>
				</Table.Row>
			</Table.Head>
			<Table.Body>
				{sortable.filter(e => showBadge === "none" || showBadge === e.type).map(e => <Table.Row key={e["element-uid"]}>
						<Table.Cell>{e["element-name"]}</Table.Cell>
						<Table.Cell>{e["target-language"]}</Table.Cell>
						<Table.Cell>{getTypeLabel(e.type)}</Table.Cell>
						<Table.Cell>{new Date(e.sortable).toLocaleDateString()}</Table.Cell>
					</Table.Row>
				)}
			</Table.Body>
		</Table>

	</Box>
}

