import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secrets from "aws-cdk-lib/aws-secretsmanager"
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codePipelineActions from "aws-cdk-lib/aws-codepipeline-actions";
import * as codeBuild from "aws-cdk-lib/aws-codebuild";

// vpcName
// cidr

interface PipelineProjectProps {
    installCommands?: string[];
    buildCommands: string[];
    policyStatements?: iam.PolicyStatement[]
    variables: {
        vpcName: codepipeline.Variable,
        cidr: codepipeline.Variable,
    }
}

export class AccountVendVpcPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Source Output

    const sourceOutput = new codepipeline.Artifact()

    // Source Action for GitLab

    const sourceAction = new codePipelineActions.GitHubSourceAction({
        actionName: "AccountVendGithubSource",
        owner: "davidbry",
        repo: "account-vend-vpc",
        oauthToken: cdk.SecretValue.secretsManager('accountvend-github-token'),
        output: sourceOutput,
        branch: 'master'
    });

    // Account Vend Pipeline Variables

    const vpcNameVariable = new codepipeline.Variable({
        variableName: "vpcName",
        description: "Name of the accounts default VPC"
    });

    const cidrVariable = new codepipeline.Variable({
        variableName: "cidr",
        description: "CIDR range of the VPC"
    });

    // Install commands for Deploy Stage

    const installCommands = [
        "npm install -g aws-cdk@2",
        "npm install",
    ];
    const deployCommands = [
        "cdk --version",
        "npm run build",
        "cdk list",
        "cdk deploy --require-approval=never",
    ]

    // Add permissions to the pipeline role

    const policyStatements = [
        new iam.PolicyStatement({
            resources: ["*"],
            actions: ["secretsmanager:GetSecretsValue"]
        }),
        new iam.PolicyStatement({
            resources: ["arn:aws:iam::637423553965:role/cdk*"],
            actions: ["sts:AssumeRole"]
        }),
    ]

    const deployProject = this.createPipelineProject("AccountVend-VPC-Pipeline-Project", {
        installCommands,
        buildCommands: deployCommands,
        policyStatements,
        variables: {
            vpcName: vpcNameVariable, 
            cidr: cidrVariable,
        },
    })

    const deployAction = new codePipelineActions.CodeBuildAction({
        actionName: "Deploy",
        project: deployProject,
        input: sourceOutput,
        runOrder: 2
    });

      // Construct an empty Pipeline

      const accountVendPipeline = new codepipeline.Pipeline(this, 'MyFirstPipeline', {
        pipelineName: "AccountVending-Pipeline",
        pipelineType: codepipeline.PipelineType.V2,
        variables: [vpcNameVariable, cidrVariable],
        stages: [
            {
                stageName: 'Source',
                actions: [sourceAction]
            },
            {
                stageName: 'Deploy',
                actions: [deployAction]
            }
        ]
    });

    }

    private createPipelineProject(id: string, props: PipelineProjectProps): codeBuild.PipelineProject {
        const { installCommands, buildCommands, policyStatements, variables } = props;

        const project = new codeBuild.PipelineProject(this, id, {
            buildSpec: codeBuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    install: installCommands ? { commands: installCommands} : undefined,
                    build: {
                        commands: buildCommands,
                    },
                }
            }),
            environment: {
                buildImage: codeBuild.LinuxBuildImage.STANDARD_7_0,
                computeType: codeBuild.ComputeType.SMALL,
            },
            environmentVariables: {
                VENDING_VPC_NAME: { value: variables.vpcName.reference() },
                VENDING_CIDR: { value: variables.cidr.reference() },
            },
        });

        if (policyStatements) {
            policyStatements.forEach(policyStatement => project.addToRolePolicy(policyStatement));
        }

        return project;
        }
    }
