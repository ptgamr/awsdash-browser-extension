import { Reservation } from "@aws-sdk/client-ec2";
import { Ec2Instance } from "../../src/types";

export function parseReservationResponse(
  reservations: Reservation[] | undefined | null
): Ec2Instance[] {
  const instanceList = (reservations || []).reduce((prev, current) => {
    return prev.concat(
      (current.Instances || []).map((iter) => {
        const instance: Ec2Instance = {
          id: iter.InstanceId!,
          type: iter.InstanceType!,
          name:
            (iter.Tags || []).find((iter) => iter.Key === "Name")?.Value ?? "",
          ipv4: iter.PublicIpAddress!,
          ipv4private: iter.PrivateIpAddress!,
          vpcId: iter.VpcId!,
          launchedAt: iter.LaunchTime!.toISOString(),
          keyName: iter.KeyName!,
          numCpu: iter.CpuOptions!.CoreCount!,
          numThread: iter.CpuOptions!.ThreadsPerCore!,
          stateName: iter.State!.Name!,
          autoscalingGroup:
            (iter.Tags || []).find(
              (iter) => iter.Key === "aws:autoscaling:groupName"
            )?.Value ?? null,
        };
        return instance;
      })
    );
  }, [] as Ec2Instance[]);

  return instanceList;
}
